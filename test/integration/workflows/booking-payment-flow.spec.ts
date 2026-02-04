import { Test, TestingModule } from '@nestjs/testing';
import { BookingService } from 'src/booking/booking.service';
import { PaymentsService } from 'src/payment/payments.services';
import { PrismaService } from 'prisma/prisma.service';
import { BookingStatus, SegmentStatus, PaymentStatus } from '@prisma/client';

/**
 * Integration tests for complete booking-payment workflow
 * Tests the end-to-end flow: create booking with segments → assign mechanics → complete segments → release payments
 */
describe('Booking-Payment Workflow Integration', () => {
  let bookingService: BookingService;
  let paymentService: PaymentsService;
  let prisma: PrismaService;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      providers: [
        BookingService,
        PaymentsService,
        PrismaService,
        // Add other required providers with mocks
      ],
    }).compile();

    bookingService = module.get<BookingService>(BookingService);
    paymentService = module.get<PaymentsService>(PaymentsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await module.close();
  });

  describe('Complete Multi-Segment Booking Flow', () => {
    it('should handle full workflow: create → assign → complete → pay', async () => {
      // 1. Create booking with multiple segments
      const createBookingDto = {
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

      const customerId = 'customer-1';
      const { booking } = await bookingService.createBooking(createBookingDto, customerId);

      expect(booking).toBeDefined();
      expect(booking.segments).toHaveLength(2);
      expect(booking.status).toBe(BookingStatus.PENDING);

      // 2. Assign mechanics to segments
      const mechanic1Id = 'mechanic-1';
      const mechanic2Id = 'mechanic-2';

      const segment1 = booking.segments[0];
      const segment2 = booking.segments[1];

      await bookingService.assignSegmentToMechanic(segment1.id, mechanic1Id);
      await bookingService.assignSegmentToMechanic(segment2.id, mechanic2Id);

      // 3. Update segment status to IN_PROGRESS
      await bookingService.updateSegmentStatus(segment1.id, SegmentStatus.IN_PROGRESS, mechanic1Id);
      await bookingService.updateSegmentStatus(segment2.id, SegmentStatus.IN_PROGRESS, mechanic2Id);

      // 4. Complete segments
      await bookingService.completeSegment(segment1.id, mechanic1Id);
      await bookingService.completeSegment(segment2.id, mechanic2Id);

      // 5. Release payments for completed segments
      await paymentService.releaseSegmentPayment(segment1.id);
      await paymentService.releaseSegmentPayment(segment2.id);

      // 6. Verify final booking status
      const finalBooking = await bookingService.getBookingById(booking.id, customerId);
      expect(finalBooking.status).toBe(BookingStatus.COMPLETED);

      // 7. Verify payment status
      const paymentStatus = await paymentService.calculatePaymentStatus(booking.id);
      expect(paymentStatus.status).toBe('COMPLETED');
    });

    it('should handle partial completion and partial payment release', async () => {
      const createBookingDto = {
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

      const customerId = 'customer-1';
      const { booking } = await bookingService.createBooking(createBookingDto, customerId);

      // Complete only first segment
      const segment1 = booking.segments[0];
      const mechanic1Id = 'mechanic-1';

      await bookingService.assignSegmentToMechanic(segment1.id, mechanic1Id);
      await bookingService.completeSegment(segment1.id, mechanic1Id);
      await paymentService.releaseSegmentPayment(segment1.id);

      // Verify booking is IN_PROGRESS (not completed)
      const currentBooking = await bookingService.getBookingById(booking.id, customerId);
      expect(currentBooking.status).toBe(BookingStatus.IN_PROGRESS);

      // Verify payment status is PARTIAL
      const paymentStatus = await paymentService.calculatePaymentStatus(booking.id);
      expect(paymentStatus.status).toBe('PARTIAL');
    });
  });
});
