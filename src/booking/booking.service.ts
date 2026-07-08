/* eslint-disable prettier/prettier */
import { 
  Injectable, 
  Logger, 
  InternalServerErrorException, 
  NotFoundException, 
  BadRequestException, 
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { BookingStatus, Role, PaymentStatus, SegmentStatus, Prisma } from '@prisma/client';
import { CreateBookingDto, CreateBookingSegmentDto, BookingFilterDto } from './dto/booking.dto';
import { CreateDispatchDto } from '../dispatch/dto/dispatch.dto';
import { IMapsService, MAPS_SERVICE_TOKEN } from 'src/common/interfaces/maps-service.interface';
import { INotificationGateway, NOTIFICATION_GATEWAY_TOKEN } from 'src/common/interfaces/notification-gateway.interface';
import { SlaService } from 'src/sla/sla.service';
import { PaymentsService } from 'src/payment/payments.services';
import { WebhookSubscriptionService } from 'src/app-ecosystem/webhook-subscription.service';
import { RevenueSharingService } from 'src/revenue-sharing/revenue-sharing.service';
import { WebhookEvent } from 'src/app-ecosystem/dto/webhook-subscription.dto';
import { Decimal } from 'decimal.js';
import { GeoService } from 'src/location/geo.service';
import { PlatformConfigService } from 'src/config/platform-config.service';
import { createHash } from 'crypto';
import { ReceiptImageService } from 'src/receipt/receipt-image.service';

@Injectable()
export class BookingService {
  private readonly logger = new Logger(BookingService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(MAPS_SERVICE_TOKEN) private readonly googleMaps: IMapsService,
    private readonly slaService: SlaService,
    @Inject(NOTIFICATION_GATEWAY_TOKEN) private readonly notificationGateway: INotificationGateway,
    private readonly paymentService: PaymentsService,
    private readonly webhookService: WebhookSubscriptionService,
    private readonly revenueSharingService: RevenueSharingService,
    private readonly geoService: GeoService,
    private readonly platformConfig: PlatformConfigService,
    private readonly receiptImageService: ReceiptImageService,
  ) {}

  /** Cost recovery: platform fee ₦100 + 2% of service total (matches frontend). */
  private calculatePlatformFee(serviceTotal: Decimal): Decimal {
    return new Decimal(100).plus(serviceTotal.mul(0.02));
  }

  /**
   * CREATE BOOKING: Create a new booking with support for multi-segment bookings
   */
  async createBooking(dto: CreateBookingDto, customerId: string) {
    const operation = 'createBooking';
    this.logger.log(`[${operation}] Creating booking for customer ${customerId}`);

    try {
      // Validate service exists if serviceId provided (for backward compatibility)
      if (dto.serviceId && !dto.segments?.length) {
        const service = await this.prisma.mechanicService.findUnique({
          where: { id: dto.serviceId },
        });
        if (!service) {
          throw new NotFoundException(`Service with ID ${dto.serviceId} not found`);
        }
      }

      // Prepare segments: use provided segments or create default single segment
      const segments: CreateBookingSegmentDto[] = Array.isArray(dto.segments) && dto.segments.length > 0
        ? dto.segments
        : dto.serviceId
          ? [{ type: 'default', price: '0', serviceId: dto.serviceId }]
          : [];
          //explain 


      if (segments.length === 0) {
        throw new BadRequestException('At least one segment or serviceId is required');
      }

      // If single segment and serviceId provided, fetch service price
      if (segments.length === 1 && dto.serviceId && (!segments[0].price || segments[0].price === '0')) {
        const service = await this.prisma.mechanicService.findUnique({
          where: { id: dto.serviceId },
        });
        if (service) {
          segments[0].price = service.price.toString();
        }
      }

      // Calculate totals (cost recovery: service total + platform fee ₦100 + 2%)
      const totalPrice = segments.reduce((sum, seg) => {
        return sum.plus(new Decimal(seg.price));
      }, new Decimal(0));
      const platformFee = this.calculatePlatformFee(totalPrice);
      const totalCharged = totalPrice.plus(platformFee);

      // Create booking with segments in a transaction
      const result = await this.prisma.$transaction(async (tx) => {
        const booking = await tx.booking.create({
          data: {
            customerId,
            mechanicId: dto.mechanicId ?? null,
            serviceId: dto.serviceId ?? segments[0]?.serviceId ?? undefined,
            status: dto.status || BookingStatus.PENDING,
            scheduledAt: dto.scheduledAt,
            pickupLatitude: new Prisma.Decimal(dto.pickupLatitude),
            pickupLongitude: new Prisma.Decimal(dto.pickupLongitude),
            pickupAddress: dto.pickupAddress,
            pickupLocationNotes: dto.pickupLocationNotes,
            price: new Prisma.Decimal(totalPrice.toString()), // Backward compatibility: service total
            totalPrice: new Prisma.Decimal(totalPrice.toString()), // Service total only
            platformFee: new Prisma.Decimal(platformFee.toString()),
            segments: {
              create: segments.map(seg => ({
                type: seg.type,
                price: new Prisma.Decimal(seg.price),
                status: SegmentStatus.PENDING,
              })),
            },
          } as any,
          include: {
            segments: true,
            customer: true,
            service: true,
          },
        });

        let payment: Awaited<ReturnType<PaymentsService['initialize']>> | null = null;
        try {
          payment = await this.paymentService.initialize({
            bookingId: booking.id,
            amount: BigInt(Math.round(totalCharged.toNumber() * 100)),
            gateway: 'PAYSTACK',
            metadata: { bookingId: booking.id, customerId },
          });
        } catch (paymentErr: any) {
          this.logger.error(`[${operation}] Payment initialization failed: ${paymentErr.message}`, paymentErr.stack);
          // Don't fail booking creation if payment init fails - it can be retried
        }

        return { booking, payment };
      }, { maxWait: 10000, timeout: 30000 });

      this.logger.log(`[${operation}] Booking created successfully: ${result.booking.id} with ${segments.length} segment(s)`);

      // Trigger webhook for booking creation (non-blocking)
      this.webhookService.triggerWebhook(WebhookEvent.BOOKING_CREATED, {
        bookingId: result.booking.id,
        customerId: result.booking.customerId,
        status: result.booking.status,
        totalPrice: (result.booking.totalPrice ?? result.booking.price).toString(),
        createdAt: result.booking.createdAt,
      }).catch((err) => {
        this.logger.warn(`[${operation}] Webhook trigger failed: ${err.message}`);
      });

      return result;
    } catch (error: any) {
      this.logger.error(`[${operation}] Failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * GET ALL BOOKINGS: Retrieve bookings with segments
   */
  async getAllBookings(userId: string, filterDto: BookingFilterDto) {
    const operation = 'getAllBookings';
    this.logger.log(`[${operation}] Fetching bookings for user ${userId}`);

    try {
      const where: Prisma.BookingWhereInput = {
        OR: [
          { customerId: userId },
          { mechanicId: userId },
        ],
        ...(filterDto.status && { status: filterDto.status }),
      };

      const [bookings, total] = await Promise.all([
        this.prisma.booking.findMany({
          where,
          include: {
            segments: {
              include: { mechanic: true },
            },
            customer: true,
            mechanic: true,
            service: true,
          },
          skip: filterDto.skip || 0,
          take: filterDto.take || 10,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.booking.count({ where }),
      ]);

      return {
        data: bookings,
        meta: {
          total,
          skip: filterDto.skip || 0,
          take: filterDto.take || 10,
        },
      };
    } catch (error: any) {
      this.logger.error(`[${operation}] Failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * GET BOOKING BY ID: Retrieve a single booking with segments
   */
  async getBookingById(bookingId: string, userId: string) {
    const operation = 'getBookingById';
    this.logger.log(`[${operation}] Fetching booking ${bookingId} for user ${userId}`);

    try {
      const booking = await this.prisma.booking.findFirst({
        where: {
          id: bookingId,
          OR: [
            { customerId: userId },
            { mechanicId: userId },
          ],
        },
        include: {
          segments: {
            include: { mechanic: true },
          },
          customer: true,
          mechanic: true,
          service: true,
          payments: true,
          disputes: true,
        },
      });

      if (!booking) {
        throw new NotFoundException(`Booking with ID ${bookingId} not found`);
      }

      return booking;
    } catch (error: any) {
      this.logger.error(`[${operation}] Failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * UPDATE BOOKING STATUS: Update overall booking status
   */
  async updateBookingStatus(bookingId: string, dto: { status: BookingStatus }, mechanicId: string) {
    const operation = 'updateBookingStatus';
    this.logger.log(`[${operation}] Updating booking ${bookingId} status to ${dto.status}`);

    try {
      const booking = await this.prisma.booking.findUnique({
        where: { id: bookingId },
        include: { segments: true },
      });

      if (!booking) {
        throw new NotFoundException(`Booking with ID ${bookingId} not found`);
      }

      if (booking.mechanicId !== mechanicId) {
        throw new ForbiddenException('You are not authorized to update this booking');
      }

      // Invisible Foreman: IN_PROGRESS only when mechanic is within geofence radius
      if (dto.status === BookingStatus.IN_PROGRESS) {
        const mechanic = await this.prisma.user.findUnique({
          where: { id: mechanicId },
          select: { currentLat: true, currentLng: true },
        });
        if (mechanic?.currentLat != null && mechanic?.currentLng != null && booking.pickupLatitude != null && booking.pickupLongitude != null) {
          const dist = this.geoService.distanceMetres(
            Number(mechanic.currentLat),
            Number(mechanic.currentLng),
            Number(booking.pickupLatitude),
            Number(booking.pickupLongitude),
          );
          const radius = await this.platformConfig.getGeofenceRadiusMetres();
          if (dist > radius) {
            throw new BadRequestException(
              `You must be within ${radius}m of the job location to start work. Current distance: ${Math.round(dist)}m`,
            );
          }
        }
      }

      // Invisible Foreman: COMPLETED only via verify-completion PIN (no direct status update)
      if (dto.status === BookingStatus.COMPLETED) {
        throw new BadRequestException(
          'Use POST /bookings/:id/verify-completion with the 4-digit PIN to complete and release payment.',
        );
      }

      // Calculate status from segments if needed
      const calculatedStatus = this.calculateBookingStatus(booking.segments);

      const updated = await this.prisma.booking.update({
        where: { id: bookingId },
        data: { status: dto.status },
        include: {
          segments: {
            include: { mechanic: true },
          },
          customer: true,
          mechanic: true,
          service: true,
        },
      });

      return updated;
    } catch (error: any) {
      this.logger.error(`[${operation}] Failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * UPDATE SEGMENT STATUS: Update individual segment status
   */
  async updateSegmentStatus(segmentId: string, status: SegmentStatus, mechanicId?: string) {
    const operation = 'updateSegmentStatus';
    this.logger.log(`[${operation}] Updating segment ${segmentId} status to ${status}`);

    try {
      const segment = await this.prisma.bookingSegment.findUnique({
        where: { id: segmentId },
        include: { booking: true },
      });

      if (!segment) {
        throw new NotFoundException(`Segment with ID ${segmentId} not found`);
      }

      // Validate mechanic if provided
      if (mechanicId && segment.mechanicId && segment.mechanicId !== mechanicId) {
        throw new ForbiddenException('You are not authorized to update this segment');
      }

      const updateData: any = { status };
      if (status === SegmentStatus.IN_PROGRESS && !segment.startedAt) {
        updateData.startedAt = new Date();
      }
      if (status === SegmentStatus.COMPLETED && !segment.completedAt) {
        updateData.completedAt = new Date();
      }

      const updated = await this.prisma.bookingSegment.update({
        where: { id: segmentId },
        data: updateData,
        include: {
          mechanic: true,
          booking: {
            include: { segments: true },
          },
        },
      });

      // Recalculate booking status
      const bookingStatus = this.calculateBookingStatus(updated.booking.segments);
      await this.prisma.booking.update({
        where: { id: updated.bookingId },
        data: { status: bookingStatus },
      });

      return updated;
    } catch (error: any) {
      this.logger.error(`[${operation}] Failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * ASSIGN SEGMENT TO MECHANIC: Assign a mechanic to a specific segment
   */
  async assignSegmentToMechanic(segmentId: string, mechanicId: string) {
    const operation = 'assignSegmentToMechanic';
    this.logger.log(`[${operation}] Assigning mechanic ${mechanicId} to segment ${segmentId}`);

    try {
      const segment = await this.prisma.bookingSegment.findUnique({
        where: { id: segmentId },
        include: { booking: true },
      });

      if (!segment) {
        throw new NotFoundException(`Segment with ID ${segmentId} not found`);
      }

      // Verify mechanic exists and is a mechanic
      const mechanic = await this.prisma.user.findUnique({
        where: { id: mechanicId },
      });

      if (!mechanic || mechanic.role !== Role.MECHANIC) {
        throw new BadRequestException('Invalid mechanic ID');
      }

      const updated = await this.prisma.bookingSegment.update({
        where: { id: segmentId },
        data: {
          mechanicId,
          status: SegmentStatus.ASSIGNED,
        },
        include: {
          mechanic: true,
          booking: true,
        },
      });

      return updated;
    } catch (error: any) {
      this.logger.error(`[${operation}] Failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * COMPLETE SEGMENT: Mark a segment as completed
   */
  async completeSegment(segmentId: string, mechanicId: string) {
    const operation = 'completeSegment';
    this.logger.log(`[${operation}] Completing segment ${segmentId} by mechanic ${mechanicId}`);

    try {
      const updated = await this.updateSegmentStatus(segmentId, SegmentStatus.COMPLETED, mechanicId);
      try {
        await this.paymentService.releaseSegmentPayment(segmentId);
      } catch (releaseErr: any) {
        this.logger.warn(
          `[${operation}] Segment marked complete but payment release skipped: ${releaseErr.message}`,
        );
      }
      return updated;
    } catch (error: any) {
      this.logger.error(`[${operation}] Failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * CALCULATE BOOKING STATUS: Determine overall booking status from segment statuses
   */
  private calculateBookingStatus(segments: Array<{ status: SegmentStatus }>): BookingStatus {
    if (segments.length === 0) {
      return BookingStatus.PENDING;
    }

    const statuses = segments.map(s => s.status);
    
    // If all segments completed → Booking COMPLETED
    if (statuses.every(s => s === SegmentStatus.COMPLETED)) {
      return BookingStatus.COMPLETED;
    }

    // If any segment cancelled → Booking CANCELLED
    if (statuses.some(s => s === SegmentStatus.CANCELLED)) {
      return BookingStatus.CANCELLED;
    }

    // If any segment in progress → Booking IN_PROGRESS
    if (statuses.some(s => s === SegmentStatus.IN_PROGRESS || s === SegmentStatus.ASSIGNED)) {
      return BookingStatus.IN_PROGRESS;
    }

    // If any segment failed → Booking could be FAILED (if you add that status)
    if (statuses.some(s => s === SegmentStatus.FAILED)) {
      return BookingStatus.CANCELLED; // Or a FAILED status if you add it
    }

    // Default: PENDING
    return BookingStatus.PENDING;
  }

  /**
   * 1️⃣ DISPATCH: Find/Assign a Mechanic & Start the Clock
   */
  async createDispatch(dto: CreateDispatchDto) {
    const booking = await this.prisma.booking.findUnique({ where: { id: dto.bookingId } });
    if (!booking || booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException('Booking not eligible for dispatch');
    }

    // Logic: If manual ID provided, use it; otherwise, find nearest online mechanic
    let mechanicId = dto.mechanicId;
    if (!mechanicId) {
      const nearest = await this.findNearestMechanic(
        Number(booking.pickupLatitude),
        Number(booking.pickupLongitude),
      );
      mechanicId = nearest.id;
    }

    const mechanic = await this.prisma.user.findUnique({ where: { id: mechanicId } });
    
    // Calculate Travel & Check for Long ETA (>30 mins)
    const travel = await this.calculateTravelAndAlert(mechanic, booking);

    return await this.prisma.$transaction(async (tx) => {
      const dispatch = await tx.dispatch.create({
        data: {
          bookingId: booking.id,
          mechanicId,
          status: 'OFFERED',
          expiresAt: new Date(Date.now() + 5 * 60000), // 5 min window
        },
      });

      await this.slaService.createOrPatchSlaRecord(booking.id, {
        status: 'PENDING',
      });

      await this.notificationGateway.emitDispatchAssigned(mechanicId, { 
        bookingId: booking.id, 
        etaMs: travel.durationMs 
      });

      return dispatch;
    });
  }

  /**
   * 2️⃣ ACCEPTANCE: Mechanic says "Yes"
   */
  async acceptDispatch(dispatchId: string, mechanicId: string) {
    return await this.prisma.$transaction(async (tx) => {
      const dispatch = await tx.dispatch.update({
        where: { id: dispatchId },
        data: { status: 'ACCEPTED' }
      });

      const booking = await tx.booking.update({
        where: { id: dispatch.bookingId },
        data: { status: BookingStatus.CONFIRMED, mechanicId }
      });

      await this.slaService.createOrPatchSlaRecord(booking.id, {
        status: 'PENDING'
      });

      await this.notificationGateway.emitDispatchAccepted(booking.id, mechanicId, booking.customerId);

      // Trigger webhook for mechanic assignment (non-blocking)
      this.webhookService.triggerWebhook(WebhookEvent.MECHANIC_ASSIGNED, {
        bookingId: booking.id,
        mechanicId,
        customerId: booking.customerId,
        status: booking.status,
        assignedAt: new Date(),
      }).catch((err) => {
        this.logger.warn(`[acceptDispatch] Webhook trigger failed: ${err.message}`);
      });

      return { booking, dispatch };
    });
  }

  /**
   * 3️⃣ ARRIVAL: Mechanic reaches the customer (Invisible Foreman: geofence check)
   */
  async mechanicArrived(bookingId: string, mechanicId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { mechanic: true },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.mechanicId !== mechanicId) throw new ForbiddenException('Not authorized');
    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new BadRequestException('Booking must be CONFIRMED before marking arrival');
    }

    const radius = await this.platformConfig.getGeofenceRadiusMetres();
    const mechanic = await this.prisma.user.findUnique({
      where: { id: mechanicId },
      select: { currentLat: true, currentLng: true },
    });
    if (mechanic?.currentLat != null && mechanic?.currentLng != null && booking.pickupLatitude != null && booking.pickupLongitude != null) {
      const dist = this.geoService.distanceMetres(
        Number(mechanic.currentLat),
        Number(mechanic.currentLng),
        Number(booking.pickupLatitude),
        Number(booking.pickupLongitude),
      );
      if (dist > radius) {
        throw new BadRequestException(
          `You must be within ${radius}m of the job location. Current distance: ${Math.round(dist)}m`,
        );
      }
    }

    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.IN_PROGRESS },
    });

    await this.slaService.createOrPatchSlaRecord(bookingId, {
      status: 'MET',
    });

    await this.notificationGateway.emitMechanicArrived(bookingId, booking.mechanicId);
    return updated;
  }

  /**
   * Invisible Foreman: Mechanic requests completion PIN (4-digit). Show on mechanic app for customer/FM to enter.
   */
  async requestCompletionPin(bookingId: string, mechanicId: string): Promise<{ pin: string; expiresAt: Date }> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { completionPin: true },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.mechanicId !== mechanicId) throw new ForbiddenException('Not authorized');
    if (booking.status !== BookingStatus.IN_PROGRESS) {
      throw new BadRequestException('Booking must be IN_PROGRESS to request completion PIN');
    }

    const pin = String(Math.floor(1000 + Math.random() * 9000));
    const pinHash = createHash('sha256').update(pin).digest('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min

    await this.prisma.completionPin.upsert({
      where: { bookingId },
      create: { bookingId, pinHash, expiresAt },
      update: { pinHash, expiresAt },
    });

    return { pin, expiresAt };
  }

  /**
   * Invisible Foreman: Customer/Fleet Manager enters PIN to confirm completion. Releases payment only when verified.
   */
  async verifyCompletionPin(bookingId: string, pin: string, userId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { completionPin: true, customer: true },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    const isCustomer = booking.customerId === userId;
    const isOrgMember = booking.orgId
      ? await this.prisma.orgMember.findFirst({
          where: { orgId: booking.orgId, userId },
        })
      : null;
    if (!isCustomer && !isOrgMember) {
      throw new ForbiddenException('Only the customer or fleet manager can verify completion');
    }
    if (!booking.completionPin) throw new BadRequestException('No completion PIN requested for this booking');
    if (booking.completionPin.verifiedAt) {
      throw new BadRequestException('Completion already verified');
    }
    if (booking.completionPin.expiresAt < new Date()) {
      throw new BadRequestException('Completion PIN has expired. Ask the mechanic to request a new one.');
    }

    const pinHash = createHash('sha256').update(pin.trim()).digest('hex');
    if (booking.completionPin.pinHash !== pinHash) {
      throw new BadRequestException('Invalid PIN');
    }

    await this.prisma.completionPin.update({
      where: { bookingId },
      data: { verifiedAt: new Date() },
    });

    const completion = await this.completeBooking(bookingId);
    try {
      await this.paymentService.releaseBookingPayment(bookingId);
    } catch (releaseErr: any) {
      this.logger.warn(
        `[verifyCompletionPin] Booking completed but payment release skipped: ${releaseErr.message}`,
      );
    }
    return completion;
  }

  /**
   * 4️⃣ COMPLETION: Job is done, money is handled
   */
  async completeBooking(bookingId: string) {
    const result = await this.prisma.$transaction(async (tx) => {
      const booking = await tx.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.COMPLETED }
      });

      await this.slaService.createOrPatchSlaRecord(bookingId, {
        status: 'MET'
      });

      return booking;
    });

    // Invisible Foreman: Generate receipt for EV jobs only (static image for WhatsApp)
    this.generateReceiptIfEv(bookingId).catch((err) => {
      this.logger.warn(`[completeBooking] Receipt generation failed: ${err.message}`);
    });

    if (result.customerId) {
      await this.notificationGateway.emitBookingCompleted(
        bookingId,
        result.mechanicId ?? '',
        result.customerId,
      );
    }

    // Record revenue share (non-blocking)
    this.revenueSharingService.recordRevenueShare(bookingId).catch((err) => {
      this.logger.warn(`[completeBooking] Revenue share recording failed: ${err.message}`);
    });

    // Trigger webhook for booking completion (non-blocking)
    this.webhookService.triggerWebhook(WebhookEvent.BOOKING_COMPLETED, {
      bookingId: result.id,
      customerId: result.customerId,
      mechanicId: result.mechanicId,
      status: result.status,
      totalPrice: (result.totalPrice ?? result.price).toString(),
      completedAt: result.updatedAt,
    }).catch((err) => {
      this.logger.warn(`[completeBooking] Webhook trigger failed: ${err.message}`);
    });

    return { result };
  }

  /**
   * 5️⃣ CANCELLATION: Safety switch
   */
  async cancelBooking(bookingId: string, userId: string) {
    return await this.prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({ where: { id: bookingId }, include: { payments: true } });
      if (!booking) throw new NotFoundException('Booking not found');
      if (booking.customerId !== userId) {
        throw new ForbiddenException('You can only cancel your own booking');
      }
      if (
        booking.status !== BookingStatus.PENDING &&
        booking.status !== BookingStatus.CONFIRMED &&
        booking.status !== BookingStatus.SCHEDULED
      ) {
        throw new BadRequestException(`Cannot cancel booking in status ${booking.status}`);
      }

      const successPayment = booking.payments?.find((p) => p.status === PaymentStatus.SUCCESS);
      if (successPayment) {
        await this.paymentService.refund(successPayment.reference, successPayment.amount, tx);
      }

      const updated = await tx.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.CANCELLED }
      });

      await this.slaService.createOrPatchSlaRecord(bookingId, { status: 'BREACHED' });

      // Trigger webhook for booking cancellation (non-blocking)
      this.webhookService.triggerWebhook(WebhookEvent.BOOKING_CANCELLED, {
        bookingId: updated.id,
        customerId: updated.customerId,
        status: updated.status,
        cancelledAt: new Date(),
      }).catch((err) => {
        this.logger.warn(`[cancelBooking] Webhook trigger failed: ${err.message}`);
      });

      return updated;
    });
  }

  /**
   * Invisible Foreman: Get receipt for booking (EV jobs only). Returns image URL for WhatsApp share.
   */
  async getReceipt(bookingId: string, userId: string): Promise<{ imageUrl: string }> {
    const booking = await this.prisma.booking.findFirst({
      where: {
        id: bookingId,
        OR: [{ customerId: userId }, { mechanicId: userId }],
      },
      include: { jobReceipt: true },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (!booking.jobReceipt) throw new NotFoundException('Receipt not available for this booking (EV jobs only)');
    return { imageUrl: booking.jobReceipt.imageUrl };
  }

  private async generateReceiptIfEv(bookingId: string): Promise<void> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { mechanic: true, service: true, segments: true, vehicle: true },
    });
    if (!booking || booking.status !== BookingStatus.COMPLETED) return;
    const isEv =
      booking.mechanic?.isEvSpecialist ||
      /ev|battery|electric/i.test(booking.service?.title ?? '') ||
      booking.segments?.some((s) => /ev|battery|electric/i.test(s.type));
    if (!isEv) return;
    const totalPrice = booking.totalPrice ?? booking.price;
    const imageUrl = await this.receiptImageService.generate({
      id: booking.id,
      vehicle: booking.vehicle
        ? {
            make: booking.vehicle.make ?? undefined,
            model: booking.vehicle.model ?? undefined,
            year: booking.vehicle.year ?? undefined,
            vin: booking.vehicle.vin ?? undefined,
          }
        : null,
      service: booking.service ? { title: booking.service.title ?? undefined } : null,
      segments: booking.segments.map((s) => ({ type: s.type })),
      totalPrice: totalPrice ? { toString: () => totalPrice.toString() } : undefined,
      mechanic: booking.mechanic
        ? {
            firstName: booking.mechanic.firstName ?? undefined,
            lastName: booking.mechanic.lastName ?? undefined,
            shopName: booking.mechanic.shopName ?? undefined,
          }
        : null,
      completedAt: booking.updatedAt,
    });
    await this.prisma.jobReceipt.upsert({
      where: { bookingId },
      create: { bookingId, imageUrl },
      update: { imageUrl },
    });
  }

  // --- HELPERS ---

  private async calculateTravelAndAlert(mechanic: any, booking: any) {
    const res = await this.googleMaps.getDistanceAndDuration(
      { lat: mechanic.currentLat, lng: mechanic.currentLng },
      { lat: booking.pickupLatitude, lng: booking.pickupLongitude }
    );

    if (res.durationSeconds > 1800) {
      await this.notificationGateway.emitBookingETALong(booking.id, res.durationSeconds);
    }
    return { distanceMeters: res.distanceMeters, durationMs: res.durationSeconds * 1000 };
  }

  private async findNearestMechanic(lat: number, lng: number) {
    const res = await this.prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
      SELECT id FROM "User" WHERE "role" = 'MECHANIC' AND "mechanicOnlineStatus" = 'ONLINE'
      ORDER BY ST_Distance(ST_MakePoint("currentLng", "currentLat"), ST_MakePoint(${lng}, ${lat})) ASC LIMIT 1
    `);
    if (!res.length) throw new NotFoundException('No mechanics found');
    return res[0];
  }
}