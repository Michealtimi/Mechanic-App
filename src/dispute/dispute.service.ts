
// src/modules/dispute/dispute.service.ts

import { 
    Injectable, 
    NotFoundException, 
    InternalServerErrorException, 
    Logger, 
    ForbiddenException, 
    BadRequestException // Added for better validation errors
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { PaymentService } from '../paymnet/payment.services';
import { AuditService } from 'src/audit/audit.service';

@Injectable()
export class DisputeService {
    private readonly logger = new Logger(DisputeService.name);

    constructor(
        private readonly prisma: PrismaService,
        // CRITICAL: Inject the services needed for financial resolution
        private readonly walletService: WalletService,
        private readonly paymentService: PaymentService,
        private readonly auditService: AuditService,
    ) {}

    // ------------------------------------
    // 1. RAISE DISPUTE (STATUS: PENDING)
    // ------------------------------------
    async raiseDispute(userId: string, bookingId: string, reason: string) {
        const operation = `Raise dispute for booking ${bookingId}`;

        // 1. Validation
        const booking = await this.prisma.booking.findUnique({ 
            where: { id: bookingId },
            include: { disputes: true }
        });
        if (!booking) throw new NotFoundException('Booking not found');

        // Prevent duplicate pending disputes
        if (booking.disputes.some(d => d.status === 'pending')) {
            throw new ForbiddenException('A pending dispute already exists for this booking.');
        }

        // 2. Creation
        try {
            const dispute = await this.prisma.dispute.create({
                data: { 
                    userId, 
                    bookingId, 
                    reason, 
                    status: 'pending',
                    // The user raising the dispute might be the customer or mechanic, 
                    // this assumes the customer is raising it.
                },
            });

            // Audit Trail
            await this.auditService.log(
                userId,
                'RAISE_DISPUTE',
                'DISPUTE', // Resource type
                dispute.id,
            );
            return dispute;
        } catch (error) {
            this.logger.error(`${operation} failed.`, error);
            throw new InternalServerErrorException('Failed to record dispute.');
        }
    }

    // ------------------------------------
    // 2. RESOLVE DISPUTE (CORE FINANCIAL LOGIC)
    // ------------------------------------
    async resolveDispute(
        disputeId: string, 
        resolution: string, 
        refundAmount: number, 
        isRefundToCustomer: boolean,
        isDebitMechanic: boolean,
    ) {
        const adminUserId = 'SYSTEM_ADMIN_ID'; // Placeholder for the admin user resolving the dispute
        const operation = `Resolve dispute ${disputeId}`;

        // 1. Fetch and Validate Dispute Status/Data
        const dispute = await this.prisma.dispute.findUnique({ 
            where: { id: disputeId },
            include: { 
                booking: { 
                    select: { id: true, customerId: true, mechanicId: true, paymentId: true } 
                } 
            }
        });
        if (!dispute) throw new NotFoundException('Dispute not found');
        if (dispute.status !== 'pending') throw new ForbiddenException('Dispute already resolved.');
        if (!dispute.booking) throw new InternalServerErrorException('Dispute is not linked to a valid booking.');
        if (refundAmount < 0) throw new BadRequestException('Refund amount must be non-negative.');
        
        const { paymentId, mechanicId } = dispute.booking;

        try {
            // 2. FINANCIAL RESOLUTION (Executed atomically)
            const updatedDispute = await this.prisma.$transaction(async (tx) => {
                if (refundAmount > 0) {
                    if (isRefundToCustomer) {
                        // Refund customer via original payment method
                        if (!paymentId) throw new InternalServerErrorException('Cannot refund: Payment reference missing.');
    
                        // The payment service handles the gateway API call
                        await this.paymentService.refundPayment(paymentId, refundAmount);
                        this.logger.log(`Customer refund initiated for ${refundAmount} via gateway.`);
                    }
                    
                    if (isDebitMechanic) {
                        // Debit mechanic's internal wallet (e.g., as penalty or adjustment)
                        await this.walletService.debitWalletWithTx(
                            tx,
                            mechanicId,
                            refundAmount, 
                            'DISPUTE_DEBIT', 
                            dispute.bookingId
                        );
                        this.logger.log(`Mechanic ${mechanicId} debited ${refundAmount} from wallet.`);
                    }
                }
                
                // 3. UPDATE DISPUTE STATUS (Must occur after financial action succeeds)
                return tx.dispute.update({
                    where: { id: disputeId },
                    data: {
                        status: 'resolved', 
                        resolution, 
                        updatedAt: new Date(),
                        resolvedAmount: refundAmount, 
                    },
                });
            });

            // Audit Trail
            await this.auditService.log(
                adminUserId, 
                'RESOLVE_DISPUTE', 
                'DISPUTE', // Resource type
                disputeId, { resolution, refundAmount }
            );

            return updatedDispute;

        } catch (error) {
            this.logger.error(`${operation} failed during financial step.`, error);
            // This ensures if the bank/gateway fails, the dispute remains pending for retry.
            throw new InternalServerErrorException('Resolution failed: Financial transaction could not be completed.');
        }
    }

    // ------------------------------------
    // 3. LIST DISPUTES (For Admin UI)
    // ------------------------------------
    async listAll() {
        return this.prisma.dispute.findMany({ 
            where: { status: 'pending' }, // Typically list pending first
            include: { user: true, booking: true } // Assuming 'user' relation exists on Dispute model
        });
    }
}