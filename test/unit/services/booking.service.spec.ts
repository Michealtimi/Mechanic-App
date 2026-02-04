import { Test, TestingModule } from '@nestjs/testing';
import { BookingService } from 'src/booking/booking.service';
import { PrismaService } from 'prisma/prisma.service';
import { GoogleMapsService } from 'src/google-maps/google-maps.service';
import { SlaService } from 'src/sla/sla.service';
import { NotificationGateway } from 'src/notification/notification.gateway';
import { PaymentsService } from 'src/payments/payments.service';
import { BookingStatus, SegmentStatus } from '@prisma/client';

describe('BookingService - Multi-Segment Functionality', () => {
  let service: BookingService;
  let prisma: PrismaService;

  const mockPrismaService = {
    booking: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    bookingSegment: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    mechanicService: {
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockGoogleMapsService = {
    getDistanceAndDuration: jest.fn(),
  };

  const mockSlaService = {
    createOrPatchSlaRecord: jest.fn(),
  };

  const mockNotificationGateway = {
    emitToUser: jest.fn(),
  };

  const mockPaymentsService = {
    initialize: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: GoogleMapsService, useValue: mockGoogleMapsService },
        { provide: SlaService, useValue: mockSlaService },
        { provide: NotificationGateway, useValue: mockNotificationGateway },
        { provide: PaymentsService, useValue: mockPaymentsService },
      ],
    }).compile();

    service = module.get<BookingService>(BookingService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createBooking', () => {
    it('should create booking with multiple segments', async () => {
      const dto = {
        serviceId: 'service-1',
        scheduledAt: new Date(),
        pickupLatitude: '34.0522',
        pickupLongitude: '-118.2437',
        pickupAddress: '123 Main St',
        segments: [
          { type: 'battery_swap', price: '50.00', serviceId: 'service-1' },
          { type: 'tire_change', price: '30.00', serviceId: 'service-2' },
        ],
      };

      const mockBooking = {
        id: 'booking-1',
        customerId: 'customer-1',
        segments: [],
        customer: { email: 'test@example.com' },
        service: { id: 'service-1', price: '50.00' },
      };

      mockPrismaService.mechanicService.findUnique.mockResolvedValue({
        id: 'service-1',
        price: '50.00',
      });

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          booking: {
            create: jest.fn().mockResolvedValue(mockBooking),
          },
        });
      });

      mockPaymentsService.initialize.mockResolvedValue({
        paymentUrl: 'https://paystack.com/pay',
        reference: 'ref-123',
      });

      const result = await service.createBooking(dto, 'customer-1');

      expect(result).toBeDefined();
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });

    it('should create single segment booking for backward compatibility', async () => {
      const dto = {
        serviceId: 'service-1',
        scheduledAt: new Date(),
        pickupLatitude: '34.0522',
        pickupLongitude: '-118.2437',
        pickupAddress: '123 Main St',
      };

      mockPrismaService.mechanicService.findUnique.mockResolvedValue({
        id: 'service-1',
        price: '50.00',
      });

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          booking: {
            create: jest.fn().mockResolvedValue({
              id: 'booking-1',
              customerId: 'customer-1',
              segments: [],
            }),
          },
        });
      });

      mockPaymentsService.initialize.mockResolvedValue({
        paymentUrl: 'https://paystack.com/pay',
        reference: 'ref-123',
      });

      const result = await service.createBooking(dto, 'customer-1');

      expect(result).toBeDefined();
    });
  });

  describe('calculateBookingStatus', () => {
    it('should return COMPLETED when all segments are completed', () => {
      const segments = [
        { status: SegmentStatus.COMPLETED },
        { status: SegmentStatus.COMPLETED },
      ];

      // Access private method via type assertion
      const status = (service as any).calculateBookingStatus(segments);
      expect(status).toBe(BookingStatus.COMPLETED);
    });

    it('should return IN_PROGRESS when any segment is in progress', () => {
      const segments = [
        { status: SegmentStatus.COMPLETED },
        { status: SegmentStatus.IN_PROGRESS },
      ];

      const status = (service as any).calculateBookingStatus(segments);
      expect(status).toBe(BookingStatus.IN_PROGRESS);
    });

    it('should return PENDING when all segments are pending', () => {
      const segments = [
        { status: SegmentStatus.PENDING },
        { status: SegmentStatus.PENDING },
      ];

      const status = (service as any).calculateBookingStatus(segments);
      expect(status).toBe(BookingStatus.PENDING);
    });
  });

  describe('assignSegmentToMechanic', () => {
    it('should assign mechanic to segment', async () => {
      const segmentId = 'segment-1';
      const mechanicId = 'mechanic-1';

      mockPrismaService.bookingSegment.findUnique.mockResolvedValue({
        id: segmentId,
        bookingId: 'booking-1',
        booking: { id: 'booking-1' },
      });

      mockPrismaService.user.findUnique.mockResolvedValue({
        id: mechanicId,
        role: 'MECHANIC',
      });

      mockPrismaService.bookingSegment.update.mockResolvedValue({
        id: segmentId,
        mechanicId,
        status: SegmentStatus.ASSIGNED,
      });

      const result = await service.assignSegmentToMechanic(segmentId, mechanicId);

      expect(result).toBeDefined();
      expect(result.mechanicId).toBe(mechanicId);
      expect(mockPrismaService.bookingSegment.update).toHaveBeenCalledWith({
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
    });
  });

  describe('completeSegment', () => {
    it('should complete a segment', async () => {
      const segmentId = 'segment-1';
      const mechanicId = 'mechanic-1';

      mockPrismaService.bookingSegment.findUnique.mockResolvedValue({
        id: segmentId,
        bookingId: 'booking-1',
        booking: {
          id: 'booking-1',
          segments: [
            { id: segmentId, status: SegmentStatus.IN_PROGRESS },
            { id: 'segment-2', status: SegmentStatus.PENDING },
          ],
        },
      });

      mockPrismaService.bookingSegment.update.mockResolvedValue({
        id: segmentId,
        status: SegmentStatus.COMPLETED,
        completedAt: new Date(),
      });

      mockPrismaService.booking.update.mockResolvedValue({
        id: 'booking-1',
        status: BookingStatus.IN_PROGRESS,
      });

      const result = await service.completeSegment(segmentId, mechanicId);

      expect(result).toBeDefined();
      expect(result.status).toBe(SegmentStatus.COMPLETED);
    });
  });
});
