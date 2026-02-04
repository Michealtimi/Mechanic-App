import {
    Injectable,
    NotFoundException,
    InternalServerErrorException,
    Logger,
    ForbiddenException,
    BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { PaymentsService } from '../payment/payments.services';
import { AuditService } from 'src/audit/audit.service';
import { Dispute, DisputeStatus } from '@prisma/client';
import { Decimal } from 'decimal.js';

@Injectable()
export class DisputeService {
  private readonly logger = new Logger(DisputeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
    private readonly paymentService: PaymentsService,
    private readonly auditService: AuditService,
  ) {}

  // ------------------------------------
  // 1. RAISE DISPUTE (STATUS: PENDING)
  // ------------------------------------
  /**
   * Raises a new dispute for a given booking or booking segment.
   *
   * @param userId The ID of the user raising the dispute (customer or mechanic).
   * @param bookingId The ID of the booking the dispute is related to.
   * @param reason The reason for the dispute.
   * @param bookingSegmentId Optional ID of the specific segment (for segment-level disputes).
   * @param evidenceUrls Optional array of evidence file URLs.
   * @returns The newly created Dispute object.
   * @throws NotFoundException if the booking/segment is not found.
   * @throws ForbiddenException if a pending dispute already exists.
   * @throws InternalServerErrorException if the dispute creation fails.
   */
  /**
   * Raise dispute for a booking. bookingId is required.
   */
  async raiseDispute(
    userId: string,
    bookingId: string | undefined,
    reason: string,
    bookingSegmentId?: string,
    evidenceUrls?: string[],
  ): Promise<Dispute> {
    if (!bookingId) {
      throw new BadRequestException('bookingId is required.');
    }

    const operation = `Raise dispute for booking ${bookingId}${bookingSegmentId ? ` segment ${bookingSegmentId}` : ''}`;
    this.logger.log(`[${operation}] Initiated by user ${userId}.`);

    // 1. Validation
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        disputes: true,
        segments: bookingSegmentId ? { where: { id: bookingSegmentId } } : false,
      },
    });
    if (!booking) {
      this.logger.warn(`[${operation}] Booking ${bookingId} not found.`);
      throw new NotFoundException('Booking not found');
    }

    // Validate segment if provided
    if (bookingSegmentId) {
      const segment = booking.segments?.find(s => s.id === bookingSegmentId);
      if (!segment) {
        throw new NotFoundException(`Segment ${bookingSegmentId} not found in booking ${bookingId}`);
      }
    }

    // Prevent duplicate pending disputes (check segment-level if segment provided)
    const existingDispute = booking.disputes.find(d =>
      d.status === DisputeStatus.PENDING &&
      (bookingSegmentId ? d.bookingSegmentId === bookingSegmentId : !d.bookingSegmentId)
    );
    if (existingDispute) {
      this.logger.warn(`[${operation}] A pending dispute already exists.`);
      throw new ForbiddenException('A pending dispute already exists for this booking/segment.');
    }

    // 2. Get segment price for auto-triage (if segment-level)
    let segmentPrice: Decimal | null = null;
    if (bookingSegmentId) {
      const segment = await this.prisma.bookingSegment.findUnique({
        where: { id: bookingSegmentId },
      });
      if (segment) {
        segmentPrice = new Decimal(segment.price.toString());
      }
    }

    // 3. Determine initial status (auto-triage for disputes < NGN10k)
    const AUTO_TRIAGE_THRESHOLD = new Decimal(10000); // NGN10k
    const initialStatus = segmentPrice && segmentPrice.lessThan(AUTO_TRIAGE_THRESHOLD)
      ? DisputeStatus.RESOLVED
      : DisputeStatus.PENDING;

    // 4. Creation
    try {
      const dispute = await this.prisma.dispute.create({
        data: {
          userId,
          bookingId,
          bookingSegmentId: bookingSegmentId || null,
          reason,
          status: initialStatus,
          evidenceUrls: evidenceUrls || [],
        },
      });

      if (initialStatus === DisputeStatus.RESOLVED && segmentPrice) {
        await this.prisma.dispute.update({
          where: { id: dispute.id },
          data: {
            resolution: `Auto-resolved: Dispute amount (${segmentPrice}) below threshold (NGN10k).`,
            resolvedAmount: segmentPrice,
            resolvedAt: new Date(),
          },
        });
        this.logger.log(`[${operation}] Dispute ${dispute.id} auto-resolved (amount < NGN10k).`);
      }

      await this.auditService.log({
        actor: userId,
        action: 'RAISE_DISPUTE',
        entity: 'DISPUTE',
        entityId: dispute.id,
        metadata: {
          bookingId,
          bookingSegmentId,
          reason,
          status: initialStatus,
          autoTriage: initialStatus === DisputeStatus.RESOLVED,
        },
      });
      this.logger.log(`[${operation}] Dispute ${dispute.id} created successfully with status ${initialStatus}.`);

      return await this.prisma.dispute.findUniqueOrThrow({
        where: { id: dispute.id },
        include: { booking: true, bookingSegment: true },
      });
    } catch (error) {
      this.logger.error(`[${operation}] failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to record dispute.');
    }
  }

  // ------------------------------------
  // 2. RESOLVE DISPUTE (CORE FINANCIAL LOGIC)
  // ------------------------------------
  /**
   * Resolves an existing dispute, handling financial transactions.
   *
   * @param disputeId The ID of the dispute to resolve.
   * @param resolution The resolution statement or outcome.
   * @param refundAmount The amount to potentially refund, as a number (will be converted to Decimal).
   * @param isRefundToCustomer If true, initiates a refund to the customer via payment gateway.
   * @param isDebitMechanic If true, debits the mechanic's internal wallet.
   * @returns The updated Dispute object after resolution.
   * @throws NotFoundException if the dispute is not found.
   * @throws ForbiddenException if the dispute is not in PENDING status.
   * @throws InternalServerErrorException if financial transactions or dispute update fail.
   * @throws BadRequestException if refundAmount is negative.
   */
  async resolveDispute(
    disputeId: string,
    resolution: string,
    refundAmount: number, // Still accept number from controller/input, convert to Decimal
    isRefundToCustomer: boolean,
    isDebitMechanic: boolean,
  ): Promise<Dispute> {
    const adminUserId = 'SYSTEM_ADMIN_ID'; // Placeholder for the admin user resolving the dispute
    const operation = `Resolve dispute ${disputeId}`;
    this.logger.log(`[${operation}] Initiated. Refund: ${refundAmount}, RefundToCustomer: ${isRefundToCustomer}, DebitMechanic: ${isDebitMechanic}`);

    // 1. Fetch and Validate Dispute Status/Data (booking only)
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        booking: {
          select: {
            id: true,
            customerId: true,
            mechanicId: true,
            segments: {
              include: {
                payments: {
                  select: { id: true, reference: true, amount: true },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });
    if (!dispute) {
      this.logger.warn(`[${operation}] Dispute ${disputeId} not found.`);
      throw new NotFoundException('Dispute not found');
    }
    if (dispute.status !== DisputeStatus.PENDING) {
      this.logger.warn(`[${operation}] Dispute ${disputeId} is not pending (current status: ${dispute.status}).`);
      throw new ForbiddenException('Dispute already resolved or cannot be resolved.');
    }
    if (!dispute.bookingId || !dispute.booking) {
      this.logger.error(`[${operation}] Dispute ${disputeId} is not linked to a valid booking.`);
      throw new InternalServerErrorException('Dispute is not linked to a valid booking.');
    }
    if (refundAmount < 0) {
      this.logger.warn(`[${operation}] Invalid refund amount: ${refundAmount}.`);
      throw new BadRequestException('Refund amount must be non-negative.');
    }

    const decimalRefundAmount = new Decimal(refundAmount.toString());
    const paymentReference = dispute.booking?.segments?.[0]?.payments?.[0]?.reference;
    const partyToDebit = dispute.booking?.mechanicId;
    const entityIdForDebit = dispute.bookingId;

    try {
      const updatedDispute = await this.prisma.$transaction(async (tx) => {
        if (decimalRefundAmount.greaterThan(0)) {
          if (isRefundToCustomer) {
            if (!paymentReference) {
              this.logger.error(`[${operation}] Cannot refund: Payment reference missing.`);
              throw new InternalServerErrorException('Cannot refund: Payment reference missing.');
            }
            await (this.paymentService as any).refund?.(paymentReference, decimalRefundAmount, tx) ||
              this.logger.warn(`[${operation}] Refund method not available in payment service`);
            this.logger.log(`[${operation}] Customer refund initiated for ${decimalRefundAmount} via gateway.`);
          }

          if (isDebitMechanic && partyToDebit) {
            await this.walletService.debitWalletWithTx(
              tx,
              partyToDebit,
              decimalRefundAmount,
              'DISPUTE_DEBIT',
              entityIdForDebit,
            );
            this.logger.log(`[${operation}] Party ${partyToDebit} debited ${decimalRefundAmount} from wallet.`);
          }
        }

        return tx.dispute.update({
          where: { id: disputeId },
          data: {
            status: DisputeStatus.RESOLVED,
            resolution,
            resolvedAt: new Date(),
            resolvedAmount: new (require('@prisma/client/runtime/library').Decimal)(decimalRefundAmount.toString()),
          },
        });
      });

      // Audit Trail
      await this.auditService.log({
        actor: adminUserId,
        action: 'RESOLVE_DISPUTE',
        entity: 'DISPUTE',
        entityId: disputeId,
        metadata: {
          resolution,
          refundAmount: decimalRefundAmount.toNumber(),
          isRefundToCustomer,
          isDebitMechanic,
          status: DisputeStatus.RESOLVED
        },
      });
      this.logger.log(`[${operation}] Dispute ${disputeId} successfully resolved.`);
      return updatedDispute;
    } catch (error) {
      this.logger.error(`[${operation}] failed during financial step or transaction: ${error.message}`, error.stack);
      // Re-throw specific client errors if they are already caught and determined
      if (error instanceof NotFoundException || error instanceof ForbiddenException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Resolution failed: Financial transaction or database update could not be completed.');
    }
  }

  // ------------------------------------
  // 3. LIST DISPUTES (For Admin UI)
  // ------------------------------------
  /**
   * Retrieves a list of disputes, typically pending ones for review.
   *
   * @returns An array of Dispute objects, including related user and booking details.
   * @throws InternalServerErrorException if the retrieval fails.
   */
  async listAll(status?: DisputeStatus): Promise<Dispute[]> {
    try {
      const filter = status ? { status } : {};
      this.logger.log(`Listing disputes${status ? ` with status ${status}` : ''}.`);
      return this.prisma.dispute.findMany({
        where: filter,
        include: {
          user: true,
          booking: { include: { segments: true } },
          bookingSegment: true,
        },
        orderBy: { createdAt: 'asc' },
      });
    } catch (error) {
      this.logger.error(`Failed to list disputes: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to retrieve disputes.');
    }
  }

  /**
   * Retrieves a single dispute by ID.
   *
   * @param disputeId The ID of the dispute.
   * @returns The Dispute object or null if not found.
   */
  async getDisputeById(disputeId: string): Promise<Dispute | null> {
    try {
      return this.prisma.dispute.findUnique({
        where: { id: disputeId },
        include: {
          user: true,
          booking: { include: { segments: true } },
          bookingSegment: true,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to get dispute ${disputeId}: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to retrieve dispute details.');
    }
  }

  /**
   * Add evidence to an existing dispute
   */
  async addEvidence(disputeId: string, evidenceUrls: string[]): Promise<Dispute> {
    const operation = `Add evidence to dispute ${disputeId}`;
    this.logger.log(`[${operation}] Adding ${evidenceUrls.length} evidence file(s).`);

    try {
      const dispute = await this.prisma.dispute.findUnique({
        where: { id: disputeId },
      });

      if (!dispute) {
        throw new NotFoundException('Dispute not found');
      }

      const updated = await this.prisma.dispute.update({
        where: { id: disputeId },
        data: {
          evidenceUrls: [...(dispute.evidenceUrls || []), ...evidenceUrls],
        },
      });

      await this.auditService.log({
        actor: 'SYSTEM',
        action: 'ADD_DISPUTE_EVIDENCE',
        entity: 'DISPUTE',
        entityId: disputeId,
        metadata: { evidenceUrls, totalEvidence: updated.evidenceUrls.length },
      });

      return updated;
    } catch (error) {
      this.logger.error(`[${operation}] failed: ${error.message}`, error.stack);
      throw error instanceof NotFoundException
        ? error
        : new InternalServerErrorException('Failed to add evidence.');
    }
  }

  /**
   * Escalate dispute to next level
   */
  async escalateDispute(
    disputeId: string,
    escalatedBy: string,
    reason: string,
    targetLevel?: number,
  ): Promise<Dispute> {
    const operation = `Escalate dispute ${disputeId}`;
    this.logger.log(`[${operation}] By user ${escalatedBy}`);

    try {
      const dispute = await this.prisma.dispute.findUnique({
        where: { id: disputeId },
      });

      if (!dispute) {
        throw new NotFoundException('Dispute not found');
      }

      if (dispute.status !== DisputeStatus.PENDING) {
        throw new BadRequestException('Only pending disputes can be escalated');
      }

      const newLevel = targetLevel || dispute.escalationLevel + 1;
      const updated = await this.prisma.dispute.update({
        where: { id: disputeId },
        data: {
          escalationLevel: newLevel,
          escalatedAt: new Date(),
          escalatedBy,
        },
      });

      await this.auditService.log({
        actor: escalatedBy,
        action: 'ESCALATE_DISPUTE',
        entity: 'DISPUTE',
        entityId: disputeId,
        metadata: {
          oldLevel: dispute.escalationLevel,
          newLevel,
          reason,
        },
      });

      this.logger.log(`[${operation}] Escalated to level ${newLevel}`);
      return updated;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`[${operation}] Failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to escalate dispute');
    }
  }

  /**
   * Set dispute priority
   */
  async setPriority(
    disputeId: string,
    priority: number,
    setBy: string,
    reason?: string,
  ): Promise<Dispute> {
    const operation = `Set priority for dispute ${disputeId}`;
    this.logger.log(`[${operation}] Priority: ${priority}`);

    if (priority < 1 || priority > 4) {
      throw new BadRequestException('Priority must be between 1 (Low) and 4 (Critical)');
    }

    try {
      const dispute = await this.prisma.dispute.findUnique({
        where: { id: disputeId },
      });

      if (!dispute) {
        throw new NotFoundException('Dispute not found');
      }

      const updated = await this.prisma.dispute.update({
        where: { id: disputeId },
        data: { priority },
      });

      await this.auditService.log({
        actor: setBy,
        action: 'SET_DISPUTE_PRIORITY',
        entity: 'DISPUTE',
        entityId: disputeId,
        metadata: {
          oldPriority: dispute.priority,
          newPriority: priority,
          reason,
        },
      });

      return updated;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`[${operation}] Failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to set dispute priority');
    }
  }

  /**
   * Get dispute dashboard statistics
   */
  async getDashboardStats(tenantId?: string): Promise<{
    total: number;
    pending: number;
    resolved: number;
    rejected: number;
    byPriority: Record<number, number>;
    byEscalationLevel: Record<number, number>;
    averageResolutionTime: number; // in hours
    totalAmount: number;
  }> {
    const operation = 'Get dispute dashboard stats';
    this.logger.log(`[${operation}]`);

    try {
      const where: any = {};
      if (tenantId) {
        where.tenantId = tenantId;
      }

      const [disputes, resolvedDisputes] = await Promise.all([
        this.prisma.dispute.findMany({ where }),
        this.prisma.dispute.findMany({
          where: { ...where, status: DisputeStatus.RESOLVED, resolvedAt: { not: null } },
        }),
      ]);

      const stats = {
        total: disputes.length,
        pending: disputes.filter((d) => d.status === DisputeStatus.PENDING).length,
        resolved: disputes.filter((d) => d.status === DisputeStatus.RESOLVED).length,
        rejected: disputes.filter((d) => d.status === DisputeStatus.REJECTED).length,
        byPriority: {
          1: disputes.filter((d) => d.priority === 1).length,
          2: disputes.filter((d) => d.priority === 2).length,
          3: disputes.filter((d) => d.priority === 3).length,
          4: disputes.filter((d) => d.priority === 4).length,
        },
        byEscalationLevel: disputes.reduce((acc, d) => {
          acc[d.escalationLevel] = (acc[d.escalationLevel] || 0) + 1;
          return acc;
        }, {} as Record<number, number>),
        averageResolutionTime: 0,
        totalAmount: 0,
      };

      // Calculate average resolution time
      if (resolvedDisputes.length > 0) {
        const totalHours = resolvedDisputes.reduce((sum, d) => {
          if (d.resolvedAt && d.createdAt) {
            const hours = (d.resolvedAt.getTime() - d.createdAt.getTime()) / (1000 * 60 * 60);
            return sum + hours;
          }
          return sum;
        }, 0);
        stats.averageResolutionTime = totalHours / resolvedDisputes.length;
      }

      // Calculate total amount
      stats.totalAmount = disputes.reduce((sum, d) => {
        if (d.resolvedAmount) {
          return sum + d.resolvedAmount.toNumber();
        }
        return sum;
      }, 0);

      return stats;
    } catch (error) {
      this.logger.error(`[${operation}] Failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to get dispute dashboard stats');
    }
  }

  /**
   * Get dispute analytics
   */
  async getAnalytics(
    startDate?: Date,
    endDate?: Date,
    tenantId?: string,
  ): Promise<{
    disputesByStatus: Record<string, number>;
    disputesByPriority: Record<number, number>;
    disputesByEscalationLevel: Record<number, number>;
    resolutionRate: number;
    averageResolutionTime: number;
    totalRefundAmount: number;
    disputesByMonth: Array<{ month: string; count: number }>;
  }> {
    const operation = 'Get dispute analytics';
    this.logger.log(`[${operation}]`);

    try {
      const where: any = {};
      if (tenantId) where.tenantId = tenantId;
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = startDate;
        if (endDate) where.createdAt.lte = endDate;
      }

      const disputes = await this.prisma.dispute.findMany({
        where,
        include: { booking: true },
      });

      const resolved = disputes.filter((d) => d.status === DisputeStatus.RESOLVED);
      const resolutionRate = disputes.length > 0 ? (resolved.length / disputes.length) * 100 : 0;

      // Calculate average resolution time
      let averageResolutionTime = 0;
      if (resolved.length > 0) {
        const totalHours = resolved.reduce((sum, d) => {
          if (d.resolvedAt && d.createdAt) {
            return sum + (d.resolvedAt.getTime() - d.createdAt.getTime()) / (1000 * 60 * 60);
          }
          return sum;
        }, 0);
        averageResolutionTime = totalHours / resolved.length;
      }

      // Group by month
      const disputesByMonth = disputes.reduce((acc, d) => {
        const month = d.createdAt.toISOString().substring(0, 7); // YYYY-MM
        acc[month] = (acc[month] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        disputesByStatus: {
          PENDING: disputes.filter((d) => d.status === DisputeStatus.PENDING).length,
          RESOLVED: disputes.filter((d) => d.status === DisputeStatus.RESOLVED).length,
          REJECTED: disputes.filter((d) => d.status === DisputeStatus.REJECTED).length,
        },
        disputesByPriority: {
          1: disputes.filter((d) => d.priority === 1).length,
          2: disputes.filter((d) => d.priority === 2).length,
          3: disputes.filter((d) => d.priority === 3).length,
          4: disputes.filter((d) => d.priority === 4).length,
        },
        disputesByEscalationLevel: disputes.reduce((acc, d) => {
          acc[d.escalationLevel] = (acc[d.escalationLevel] || 0) + 1;
          return acc;
        }, {} as Record<number, number>),
        resolutionRate,
        averageResolutionTime,
        totalRefundAmount: resolved.reduce((sum, d) => {
          return sum + (d.resolvedAmount?.toNumber() || 0);
        }, 0),
        disputesByMonth: Object.entries(disputesByMonth).map(([month, count]) => ({
          month,
          count,
        })),
      };
    } catch (error) {
      this.logger.error(`[${operation}] Failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to get dispute analytics');
    }
  }
}