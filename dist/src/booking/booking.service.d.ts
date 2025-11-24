import { PrismaService } from 'prisma/prisma.service';
import { CreateBookingDto } from './dto/creating-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { BookingFilterDto } from './dto/booking-filter.dto';
import { PaymentService } from '../paymnet/payment.services';
import { NotificationGateway } from 'src/notification/notification.gateway';
import { WalletService } from 'src/wallet/wallet.service';
import { AuditService } from 'src/audit/audit.service';
export declare class BookingService {
    private readonly prisma;
    private readonly paymentService;
    private readonly walletService;
    private readonly auditService;
    private readonly notificationGateway;
    private readonly logger;
    constructor(prisma: PrismaService, paymentService: PaymentService, walletService: WalletService, auditService: AuditService, notificationGateway: NotificationGateway);
    createBooking(dto: CreateBookingDto, customerId: string): Promise<any>;
    getAllBookings(userId: string, filter: BookingFilterDto): Promise<{
        data: any;
        meta: {
            total: any;
            skip: number;
            take: number;
            hasMore: boolean;
        };
    }>;
    getBookingById(id: string, userId: string): Promise<any>;
    updateBookingStatus(id: string, dto: UpdateBookingStatusDto, mechanicId: string): Promise<any>;
    cancelBooking(id: string, customerId: string): Promise<any>;
}
