import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from 'src/payment/payments.services';
import { PrismaService } from 'prisma/prisma.service';
import { WalletService } from 'src/wallet/wallet.service';
import { NotificationGateway } from 'src/notification/notification.gateway';
import { PaymentEventService } from 'src/payment/payment-event.service';
import { ConfigService } from '@nestjs/config';
import { PaymentStatus } from '@prisma/client';

describe('PaymentsService - Segment-Level Payments', () => {
  let service: PaymentsService;
  let prisma: PrismaService;
  let walletService: WalletService;

  const mockPrismaService = {
    booking: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    bookingSegment: {
      findUnique: jest.fn(),
    },
    payment: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      findUniqueOrThrow: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockGateway = {
    initializePayment: jest.fn(),
    verifyPayment: jest.fn(),
  };

  const mockWalletService = {
    creditMechanicWithTx: jest.fn(),
    creditMechanicInTransaction: jest.fn(),
  };

  const mockNotificationGateway = {
    emitBookingConfirmed: jest.fn(),
  };

  const mockPaymentEventService = {
    recordOrIgnore: jest.fn(),
  };

  const mockMetricsService = {
    increment: jest.fn(),
    observe: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
    getOrThrow: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: 'IPaymentGateway', useValue: mockGateway },
        { provide: WalletService, useValue: mockWalletService },
        { provide: NotificationGateway, useValue: mockNotificationGateway },
        { provide: PaymentEventService, useValue: mockPaymentEventService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: 'MetricsService', useValue: mockMetricsService },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    prisma = module.get<PrismaService>(PrismaService);
    walletService = module.get<WalletService>(WalletService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialize - Segment-Level Payments', () => {
    it('should create payment records for each segment', async () => {
      const dto = {
        bookingId: 'booking-1',
        amount: BigInt(10000),
        gateway: 'PAYSTACK', // cSpell:ignore PAYSTACK - Payment gateway name
        metadata: {},
      };

      const mockBooking = {
        id: 'booking-1',
        customerId: 'customer-1',
        status: 'PENDING',
        customer: { email: 'test@example.com' },
        segments: [
          { id: 'segment-1', price: '50.00', type: 'battery_swap' },
          { id: 'segment-2', price: '30.00', type: 'tire_change' },
        ],
      };

      mockPrismaService.booking.findUnique.mockResolvedValue(mockBooking);
      mockGateway.initializePayment.mockResolvedValue({
        reference: 'ref-123',
        paymentUrl: 'https://paystack.com/pay',
        raw: {},
      });

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          payment: {
            create: jest.fn().mockResolvedValue({
              id: 'payment-1',
              reference: 'ref-123',
            }),
          },
        });
      });

      const result = await service.initialize(dto);

      expect(result).toBeDefined();
      expect(mockPrismaService.booking.findUnique).toHaveBeenCalledWith({
        where: { id: dto.bookingId },
        include: { customer: true },
      });
    });
  });

  describe('releaseSegmentPayment', () => {
    it('should release payment for completed segment', async () => {
      const segmentId = 'segment-1';

      const mockSegment = {
        id: segmentId,
        status: 'COMPLETED',
        price: '50.00',
        booking: {
          id: 'booking-1',
          mechanicId: 'mechanic-1',
        },
        payments: [
          {
            id: 'payment-1',
            bookingSegmentId: segmentId,
            status: PaymentStatus.SUCCESS,
            amount: '50.00',
            metadata: {},
          },
        ],
      };

      mockPrismaService.bookingSegment.findUnique.mockResolvedValue(mockSegment);
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          payment: {
            update: jest.fn().mockResolvedValue({}),
          },
        });
      });

      mockWalletService.creditMechanicWithTx.mockResolvedValue({});

      const result = await service.releaseSegmentPayment(segmentId);

      expect(result).toBeDefined();
      expect(result.segmentId).toBe(segmentId);
      expect(mockWalletService.creditMechanicWithTx).toHaveBeenCalled();
    });

    it('should throw error if segment is not completed', async () => {
      const segmentId = 'segment-1';

      mockPrismaService.bookingSegment.findUnique.mockResolvedValue({
        id: segmentId,
        status: 'IN_PROGRESS',
        booking: { id: 'booking-1' },
        payments: [],
      });

      await expect(service.releaseSegmentPayment(segmentId)).rejects.toThrow();
    });
  });

  describe('calculatePaymentStatus', () => {
    it('should return COMPLETED when all segments are paid', async () => {
      const bookingId = 'booking-1';

      mockPrismaService.booking.findUnique.mockResolvedValue({
        id: bookingId,
        price: '100.00',
        totalPrice: '100.00',
        segments: [
          {
            id: 'segment-1',
            price: '50.00',
            payments: [
              {
                id: 'payment-1',
                status: PaymentStatus.SUCCESS,
              },
            ],
          },
          {
            id: 'segment-2',
            price: '50.00',
            payments: [
              {
                id: 'payment-2',
                status: PaymentStatus.SUCCESS,
              },
            ],
          },
        ],
        payments: [],
      });

      const result = await service.calculatePaymentStatus(bookingId);

      expect(result.status).toBe('COMPLETED');
      expect(result.segments).toHaveLength(2);
    });

    it('should return PARTIAL when some segments are paid', async () => {
      const bookingId = 'booking-1';

      mockPrismaService.booking.findUnique.mockResolvedValue({
        id: bookingId,
        price: '100.00',
        totalPrice: '100.00',
        segments: [
          {
            id: 'segment-1',
            price: '50.00',
            payments: [
              {
                id: 'payment-1',
                status: PaymentStatus.SUCCESS,
              },
            ],
          },
          {
            id: 'segment-2',
            price: '50.00',
            payments: [],
          },
        ],
        payments: [],
      });

      const result = await service.calculatePaymentStatus(bookingId);

      expect(result.status).toBe('PARTIAL');
    });
  });
});
