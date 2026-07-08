import { Test, TestingModule } from '@nestjs/testing';
import { BookingController } from 'src/booking/booking.controller';
import { BookingService } from 'src/booking/booking.service';
import { BookingStatus, SegmentStatus } from '@prisma/client';

describe('BookingController', () => {
  let controller: BookingController;
  let bookingService: jest.Mocked<BookingService>;

  const mockUser = (id: string, overrides: Record<string, any> = {}) => ({
    user: { id, ...overrides },
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookingController],
      providers: [
        {
          provide: BookingService,
          useValue: {
            createBooking: jest.fn(),
            getAllBookings: jest.fn(),
            getBookingById: jest.fn(),
            getReceipt: jest.fn(),
            updateBookingStatus: jest.fn(),
            cancelBooking: jest.fn(),
            assignSegmentToMechanic: jest.fn(),
            updateSegmentStatus: jest.fn(),
            completeSegment: jest.fn(),
            requestCompletionPin: jest.fn(),
            verifyCompletionPin: jest.fn(),
            mechanicArrived: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<BookingController>(BookingController);
    bookingService = module.get(BookingService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('createBooking should call service with customer id', async () => {
    const dto: any = { pickupLatitude: '1', pickupLongitude: '2', pickupAddress: 'addr' };
    const req = mockUser('customer-1');
    const booking = { id: 'booking-1' };
    bookingService.createBooking.mockResolvedValue({ booking, payment: null } as any);

    const result = await controller.createBooking(dto, req as any);
    expect(bookingService.createBooking).toHaveBeenCalledWith(dto, 'customer-1');
    expect(result.id).toBe('booking-1');
  });

  it('getAllBookings should call service with user id and filter', async () => {
    const req = mockUser('user-1');
    const filter: any = { status: BookingStatus.PENDING, skip: 0, take: 10 };
    bookingService.getAllBookings.mockResolvedValue({
      data: [{ id: 'b1' }],
      meta: { total: 1, skip: 0, take: 10 },
    } as any);

    const result = await controller.getAllBookings(req as any, filter);
    expect(bookingService.getAllBookings).toHaveBeenCalledWith('user-1', filter);
    expect(result.data[0].id).toBe('b1');
  });

  it('getBookingById should call service with booking id and user id', async () => {
    const req = mockUser('user-1');
    const booking = { id: 'b1' };
    bookingService.getBookingById.mockResolvedValue(booking as any);

    const result = await controller.getBookingById('b1', req as any);
    expect(bookingService.getBookingById).toHaveBeenCalledWith('b1', 'user-1');
    expect(result.id).toBe('b1');
  });

  it('cancelBooking should call service with booking id and customer id', async () => {
    const req = mockUser('customer-1');
    const booking = { id: 'b1', status: BookingStatus.CANCELLED };
    bookingService.cancelBooking.mockResolvedValue(booking as any);

    const result = await controller.cancelBooking('b1', req as any);
    expect(bookingService.cancelBooking).toHaveBeenCalledWith('b1', 'customer-1');
    expect(result.id).toBe('b1');
  });

  it('assignSegmentToMechanic should default mechanicId to current user when not provided', async () => {
    const req = mockUser('mech-1');
    const segment = { id: 'seg-1', mechanicId: 'mech-1' };
    bookingService.assignSegmentToMechanic.mockResolvedValue(segment as any);

    const result = await controller.assignSegmentToMechanic(
      'b1',
      'seg-1',
      {} as any,
      req as any,
    );
    expect(bookingService.assignSegmentToMechanic).toHaveBeenCalledWith('seg-1', 'mech-1');
    expect(result.id).toBe('seg-1');
  });

  it('updateSegmentStatus should call service with segment id, status and mechanicId', async () => {
    const req = mockUser('mech-1');
    const segment = { id: 'seg-1', status: SegmentStatus.IN_PROGRESS };
    bookingService.updateSegmentStatus.mockResolvedValue(segment as any);

    const body = { status: SegmentStatus.IN_PROGRESS };
    const result = await controller.updateSegmentStatus(
      'b1',
      'seg-1',
      body as any,
      req as any,
    );
    expect(bookingService.updateSegmentStatus).toHaveBeenCalledWith(
      'seg-1',
      body.status,
      'mech-1',
    );
    expect(result.id).toBe('seg-1');
  });

  it('completeSegment should call service with segment id and mechanic id', async () => {
    const req = mockUser('mech-1');
    const segment = { id: 'seg-1', status: SegmentStatus.COMPLETED };
    bookingService.completeSegment.mockResolvedValue(segment as any);

    const result = await controller.completeSegment('b1', 'seg-1', req as any);
    expect(bookingService.completeSegment).toHaveBeenCalledWith('seg-1', 'mech-1');
    expect(result.id).toBe('seg-1');
  });

  it('requestCompletion should call service with booking id and mechanic id', async () => {
    const req = mockUser('mech-1');
    const resp = { pin: '1234', expiresAt: new Date() };
    bookingService.requestCompletionPin.mockResolvedValue(resp as any);

    const result = await controller.requestCompletion('b1', req as any);
    expect(bookingService.requestCompletionPin).toHaveBeenCalledWith('b1', 'mech-1');
    expect(result.pin).toBe('1234');
  });

  it('verifyCompletion should call service with booking id, pin and user id', async () => {
    const req = mockUser('user-1');
    const body = { pin: '1234' };
    const resp = { bookingId: 'b1' };
    bookingService.verifyCompletionPin.mockResolvedValue(resp as any);

    const result = await controller.verifyCompletion('b1', body as any, req as any);
    expect(bookingService.verifyCompletionPin).toHaveBeenCalledWith('b1', '1234', 'user-1');
    expect(result.bookingId).toBe('b1');
  });

  it('mechanicArrived should call service with booking id and mechanic id', async () => {
    const req = mockUser('mech-1');
    const booking = { id: 'b1', status: BookingStatus.IN_PROGRESS };
    bookingService.mechanicArrived.mockResolvedValue(booking as any);

    const result = await controller.mechanicArrived('b1', req as any);
    expect(bookingService.mechanicArrived).toHaveBeenCalledWith('b1', 'mech-1');
    expect(result.id).toBe('b1');
  });
}

