/* eslint-disable prettier/prettier */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Logger, // 🆕 Added Logger for better-structured logging
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateBookingDto } from './dto/creating-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { BookingStatus } from '@prisma/client';

@Injectable()
export class BookingService {
  private readonly logger = new Logger(BookingService.name); // 🆕 Initialized Logger

  constructor(private readonly prisma: PrismaService) {}

  /**
   * =============================
   * CREATE BOOKING
   * =============================
   * Creates a new booking for a customer with a mechanic.
   */
  async createBooking(dto: CreateBookingDto, customerId: string) {
    this.logger.log(`[createBooking] received request for customer: ${customerId}`);
    console.log(`[createBooking] DTO: `, dto);

    // 🆕 Removed redundant try...catch block. NestJS's global exception filter
    // will now handle exceptions thrown by this method.

    // Check if mechanic exists
    const mechanic = await this.prisma.user.findUnique({
      where: { id: dto.mechanicId },
    });
    if (!mechanic) {
      this.logger.warn(`[createBooking] Mechanic not found: ${dto.mechanicId}`);
      throw new NotFoundException('Mechanic not found');
    }

    // Check if service exists
    const service = await this.prisma.mechanicService.findUnique({
      where: { id: dto.serviceId },
    });
    if (!service) {
      this.logger.warn(`[createBooking] Service not found: ${dto.serviceId}`);
      throw new NotFoundException('Service not found');
    }

    // Authorization: Ensure the service belongs to the mechanic
    if (service.mechanicId !== dto.mechanicId) {
      this.logger.error(`[createBooking] Forbidden: Service ${dto.serviceId} does not belong to mechanic ${dto.mechanicId}`);
      throw new ForbiddenException('Service does not belong to this mechanic');
    }

    // Check for time slot conflicts
    const existingBooking = await this.prisma.booking.findFirst({
      where: {
        scheduledAt: dto.scheduledAt,
        mechanicId: dto.mechanicId,
      },
    });
    if (existingBooking) {
      this.logger.warn(`[createBooking] Conflict: Time slot at ${dto.scheduledAt} already booked for mechanic ${dto.mechanicId}`);
      throw new ConflictException('Time slot already booked');
    }

    // Create the booking
    const booking = await this.prisma.booking.create({
      data: {
        customerId,
        mechanicId: dto.mechanicId,
        serviceId: dto.serviceId,
        scheduledAt: new Date(dto.scheduledAt),
        status: dto.status || BookingStatus.PENDING,
      },
      // 🆕 Added 'include' to return related data for better context in the response
      include: {
        customer: true,
        mechanic: true,
        service: true,
      },
    });

    this.logger.log(`[createBooking] Booking created successfully with ID: ${booking.id}`);
    console.log(`[createBooking] New booking data:`, booking);

    // 🆕 Removed manual response object (e.g., { success: true, ... }).
    // The controller or an interceptor should handle this. The service should
    // return the raw data object directly.
    return booking;
  }

  // -------------------------------------------------------------

  /**
   * =============================
   * GET ALL BOOKINGS FOR USER
   * =============================
   * Retrieves all bookings for a given customer or mechanic.
   */
  async getAllBookings(userId: string) {
    this.logger.log(`[getAllBookings] Fetching all bookings for user ID: ${userId}`);

    // 🆕 Removed redundant try...catch block.
    const bookings = await this.prisma.booking.findMany({
      where: {
        OR: [{ mechanicId: userId }, { customerId: userId }],
      },
      include: { // 🆕 Added includes to provide richer data
        customer: {
          select: { firstName: true, lastName: true },
        },
        mechanic: {
          select: { shopName: true },
        },
        service: true,
      },
    });

    this.logger.log(`[getAllBookings] Found ${bookings.length} bookings for user ${userId}`);
    
    // 🆕 Removed manual response object and plainToInstance.
    return bookings;
  }

  // -------------------------------------------------------------

  /**
   * =============================
   * GET BOOKING BY ID
   * =============================
   * Retrieves a single booking by its ID.
   */
  async getBookingById(id: string, userId: string) {
    this.logger.log(`[getBookingById] Fetching booking with ID: ${id} for user ${userId}`);

    // 🆕 Removed redundant try...catch block.
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: { // 🆕 Added includes to provide richer data
        customer: true,
        mechanic: true,
        service: true,
      },
    });
    if (!booking) {
      this.logger.warn(`[getBookingById] Booking with ID ${id} not found.`);
      throw new NotFoundException('Booking not found');
    }

    // Authorization: Ensure the user is either the customer or the mechanic
    if (booking.customerId !== userId && booking.mechanicId !== userId) {
      this.logger.error(`[getBookingById] Forbidden: User ${userId} does not have access to booking ${id}`);
      throw new ForbiddenException('You do not have access to this booking');
    }

    this.logger.log(`[getBookingById] Successfully retrieved booking ${id}`);
    // 🆕 Removed manual response object and plainToInstance.
    return booking;
  }

  // -------------------------------------------------------------

  /**
   * =============================
   * UPDATE BOOKING STATUS
   * =============================
   * Updates the status of a booking.
   */
  async updateBookingStatus(id: string, dto: UpdateBookingStatusDto, mechanicId: string) {
    this.logger.log(`[updateBookingStatus] Updating booking ${id} to status ${dto.status} by mechanic ${mechanicId}`);

    // 🆕 Removed redundant try...catch block.
    const booking = await this.prisma.booking.findUnique({
      where: { id },
    });
    if (!booking) {
      this.logger.warn(`[updateBookingStatus] Booking with ID ${id} not found.`);
      throw new NotFoundException('Booking not found');
    }

    // Authorization: Only the mechanic can update the status of their bookings
    if (booking.mechanicId !== mechanicId) {
      this.logger.error(`[updateBookingStatus] Forbidden: Mechanic ${mechanicId} cannot update booking ${id}`);
      throw new ForbiddenException('You cannot update this booking');
    }

    const updatedBooking = await this.prisma.booking.update({
      where: { id },
      data: { status: dto.status },
    });
    
    this.logger.log(`[updateBookingStatus] Successfully updated booking ${id}`);
    // 🆕 Removed manual response object and plainToInstance.
    return updatedBooking;
  }

  // -------------------------------------------------------------

  /**
   * =============================
   * CANCEL BOOKING
   * =============================
   * Cancels a booking.
   */
  async cancelBooking(id: string, customerId: string) {
    this.logger.log(`[cancelBooking] Cancelling booking ${id} by customer ${customerId}`);

    // 🆕 Removed redundant try...catch block.
    const booking = await this.prisma.booking.findUnique({
      where: { id },
    });
    if (!booking) {
      this.logger.warn(`[cancelBooking] Booking with ID ${id} not found.`);
      throw new NotFoundException('Booking not found');
    }

    // Authorization: Only the customer can cancel their own booking
    if (booking.customerId !== customerId) {
      this.logger.error(`[cancelBooking] Forbidden: Customer ${customerId} cannot cancel booking ${id}`);
      throw new ForbiddenException('You cannot cancel this booking');
    }

    const updatedBooking = await this.prisma.booking.update({
      where: { id },
      data: { status: BookingStatus.CANCELLED },
    });
    
    this.logger.log(`[cancelBooking] Successfully cancelled booking ${id}`);
    // 🆕 Removed manual response object. The controller should format a success message.
    return updatedBooking;
  }
}