/* eslint-disable prettier/prettier */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  InternalServerErrorException, // 🆕 Added InternalServerErrorException
  Logger,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateBookingDto } from './dto/creating-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { BookingStatus } from '@prisma/client';
import { BookingFilterDto } from './dto/booking-filter.dto';

@Injectable()
export class BookingService {
  private readonly logger = new Logger(BookingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentService: PaymentService, // 👈 New dependency
    private readonly walletService: WalletService,   // 👈 New dependency
    private readonly notificationGateway: NotificationGateway,
  ) {}

  /**
   * =============================
   * CREATE BOOKING
   * =============================
   * Creates a new booking for a customer with a mechanic.
   */
  async createBooking(dto: CreateBookingDto, customerId: string) {
    // 💡 CONSOLE LOG: Start of operation
    console.log(`[createBooking] Starting creation for customer: ${customerId}`);
    this.logger.log(`[createBooking] received request for customer: ${customerId}`);

    try {
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
          price: service.price, // 💰 record the agreed price
        },
        include: {
          customer: true,
          mechanic: true,
          service: true,
        },
      });

      this.logger.log(`[createBooking] Booking created successfully with ID: ${booking.id}`);
      // 💡 CONSOLE LOG: Success
      console.log(`[createBooking] Successfully created booking ID: ${booking.id}`);

      return booking;
    } catch (err) {
      this.logger.error(`Failed to create booking for customer ${customerId}`, err.stack);
      // Re-throw specific client errors
      if (
        err instanceof NotFoundException ||
        err instanceof ForbiddenException ||
        err instanceof ConflictException
      ) {
        throw err;
      }
      throw new InternalServerErrorException('Failed to create booking');
    }
  }

  // -------------------------------------------------------------

  /**
   * =============================
   * GET ALL BOOKINGS FOR USER
   * =============================
   * Retrieves all bookings for a given customer or mechanic.
   */
 async getAllBookings(userId: string, filter: BookingFilterDto) {
  // 💡 CONSOLE LOG: Start of operation
  console.log(`[getAllBookings] Fetching bookings for user ID: ${userId} with filters:`, filter);
  this.logger.log(`[getAllBookings] Fetching bookings for user ID: ${userId}, Status: ${filter.status}, Skip: ${filter.skip}, Take: ${filter.take}`);

  try {
    // 1. Get the paginated bookings
    const bookings = await this.prisma.booking.findMany({
      where: {
        // Find bookings where the user is EITHER the mechanic OR the customer
        OR: [{ mechanicId: userId }, { customerId: userId }],
        // Apply the optional status filter
        status: filter?.status, 
      },
      // Apply sorting
      orderBy: { scheduledAt: 'desc' }, 
      // Apply pagination
      skip: filter?.skip || 0,
      take: filter?.take || 10,
      
      include: {
        customer: {
          select: { id: true, firstName: true, lastName: true },
        },
        mechanic: {
          select: { id: true, shopName: true },
        },
        service: true,
      },
    });

    // 2. Get the total count for pagination metadata
    const total = await this.prisma.booking.count({
      where: {
        OR: [{ mechanicId: userId }, { customerId: userId }],
        status: filter?.status,
      },
    });

    this.logger.log(`[getAllBookings] Found ${bookings.length} bookings (Total: ${total}) for user ${userId}`);
    // 💡 CONSOLE LOG: Success
    console.log(`[getAllBookings] Returning ${bookings.length} bookings out of ${total} total.`);

    // 3. Return the data and metadata
    return {
      data: bookings,
      meta: {
        total,
        skip: filter?.skip || 0,
        take: filter?.take || 10,
        hasMore: (filter?.skip || 0) + (filter?.take || 10) < total,
      },
    };
  } catch (err) {
    this.logger.error(`Failed to get all bookings for user ${userId}`, err.stack);
    // Re-throw specific client errors (none expected from Prisma in this case)
    throw new InternalServerErrorException('Failed to retrieve bookings');
  }
}

  // -------------------------------------------------------------

  /**
   * =============================
   * GET BOOKING BY ID
   * =============================
   * Retrieves a single booking by its ID.
   */
  async getBookingById(id: string, userId: string) {
    // 💡 CONSOLE LOG: Start of operation
    console.log(`[getBookingById] Checking access for booking ID: ${id} by user ${userId}`);
    this.logger.log(`[getBookingById] Fetching booking with ID: ${id} for user ${userId}`);

    try {
      const booking = await this.prisma.booking.findUnique({
        where: { id },
        include: {
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
      // 💡 CONSOLE LOG: Success
      console.log(`[getBookingById] Booking ${id} retrieved.`);

      return booking;
    } catch (err) {
      this.logger.error(`Failed to get booking by ID ${id}`, err.stack);
      // Re-throw specific client errors
      if (err instanceof NotFoundException || err instanceof ForbiddenException) {
        throw err;
      }
      throw new InternalServerErrorException('Failed to retrieve booking');
    }
  }

  // -------------------------------------------------------------

  /**
   * =============================
   * UPDATE BOOKING STATUS
   * =============================
   * Updates the status of a booking.
   */
  // src/booking/booking.service.ts
async updateBookingStatus(id: string, dto: UpdateBookingStatusDto, mechanicId: string) {
    // 💡 CONSOLE LOG: Start of operation
    console.log(`[updateBookingStatus] Attempting to update booking ${id} status to ${dto.status}`);
    this.logger.log(`[updateBookingStatus] Updating booking ${id} to status ${dto.status} by mechanic ${mechanicId}`);

    try {
        // 1. Find the booking, including the fields needed for subsequent actions (price, customerId)
        const booking = await this.prisma.booking.findUnique({
            where: { id },
            // Select only the fields needed for the logic/updates/payments
            select: {
                id: true,
                mechanicId: true,
                customerId: true,
                price: true, // Assuming 'price' is a field on the Booking model
                status: true,
            },
        });

        if (!booking) {
            this.logger.warn(`[updateBookingStatus] Booking with ID ${id} not found.`);
            throw new NotFoundException('Booking not found');
        }

        // 2. Authorization: Only the mechanic can update the status of their bookings
        if (booking.mechanicId !== mechanicId) {
            this.logger.error(`[updateBookingStatus] Forbidden: Mechanic ${mechanicId} cannot update booking ${id}`);
            throw new ForbiddenException('You cannot update this booking');
        }

        // 3. Update the booking status in the database
        const updatedBooking = await this.prisma.booking.update({
            where: { id },
            data: { status: dto.status },
        });

        // 4. Conditional Business Logic: Execute payment/wallet/notification only if status is COMPLETED
        if (dto.status === BookingStatus.COMPLETED) {
            // NOTE: These are crucial operations and should ideally be wrapped in a transaction 
            // or handled via an event bus for robustness/retries, but for a direct refactor:
            
            this.logger.log(`[updateBookingStatus] Booking ${id} completed. Initiating payment and notification.`);
            
            // Assuming 'booking.id' is the payment ID, 'booking.price' is the amount, etc.
            // These calls rely on the injected services: paymentService, walletService, notificationGateway
            await this.paymentService.capturePayment(booking.id);
            await this.walletService.creditMechanic(booking.mechanicId, booking.price, booking.id);
            await this.notificationGateway.emitBookingCompleted(booking.customerId, booking.id);

            this.logger.log(`[updateBookingStatus] Post-completion actions successful for booking ${id}.`);
        }

        this.logger.log(`[updateBookingStatus] Successfully updated booking ${id}`);
        // 💡 CONSOLE LOG: Success
        console.log(`[updateBookingStatus] Booking ${id} updated to ${updatedBooking.status}`);

        return updatedBooking;
    } catch (err) {
        this.logger.error(`Failed to update booking status for ID ${id}. Error: ${err.message}`, err.stack);
        
        // Re-throw specific client errors (NotFound or Forbidden are generally safe)
        if (err instanceof NotFoundException || err instanceof ForbiddenException) {
            throw err;
        }

        // If payment/wallet/notification fails, it may throw a specific error, 
        // but we catch it here and treat it as a server issue for now.
        // It's often better to try/catch the conditional logic separately 
        // to return more specific error messages if, e.g., payment fails.
        throw new InternalServerErrorException('Failed to update booking status or complete post-update actions.');
    }
}

  // -------------------------------------------------------------

  /**
   * =============================
   * CANCEL BOOKING
   * =============================
   * Cancels a booking.
   */
 // src/booking/booking.service.ts (Refactored method)

// Assuming your service has injected these dependencies:
// constructor(
//     private readonly prisma: PrismaService,
//     private readonly paymentService: PaymentService,
//     private readonly notificationGateway: NotificationGateway,
// ) {}

// Note: I've added a placeholder for cancelFeeAmount logic.
 // Example: 10% fee

async cancelBooking(id: string, customerId: string) {
    // 💡 CONSOLE LOG: Start of operation
    console.log(`[cancelBooking] Attempting to cancel booking ${id} by customer ${customerId}`);
    this.logger.log(`[cancelBooking] Cancelling booking ${id} by customer ${customerId}`);

    try {
        // 1. Find the booking, including the fields needed for authorization, refund, and notification
        const booking = await this.prisma.booking.findUnique({
            where: { id },
            select: {
                id: true,
                customerId: true,
                mechanicId: true, // Needed for notification
                price: true, // Assuming 'price' exists and is needed for fee calculation
                paymentStatus: true, // Needed for conditional refund logic (assumed field)
            },
        });
        
        if (!booking) {
            this.logger.warn(`[cancelBooking] Booking with ID ${id} not found.`);
            throw new NotFoundException('Booking not found');
        }

        // 2. Authorization: Only the customer can cancel their own booking
        if (booking.customerId !== customerId) {
            this.logger.error(`[cancelBooking] Forbidden: Customer ${customerId} cannot cancel booking ${id}`);
            throw new ForbiddenException('You cannot cancel this booking');
        }

        const CANCEL_FEE_PERCENTAGE = 0.1;
        
        // 3. Conditional Business Logic (Refund)
        if (booking.paymentStatus === 'AUTHORIZED') {
            // Calculate the amount to refund (Total Price - Cancellation Fee)
            // Example calculation: refund 90%
            const cancelFeeAmount = booking.price * CANCEL_FEE_PERCENTAGE;
            const refundAmount = booking.price - cancelFeeAmount;
            
            this.logger.log(`[cancelBooking] Processing partial refund of ${refundAmount} (Fee: ${cancelFeeAmount}) for booking ${booking.id}.`);
            
            // Assuming partialRefund takes the booking ID and the amount to refund
            await this.paymentService.partialRefund(booking.id, refundAmount); 
            
            // You might want to update the booking with a 'refundStatus' field here
        }

        // 4. Update the booking status in the database
        const updatedBooking = await this.prisma.booking.update({
            where: { id },
            data: { status: BookingStatus.CANCELLED },
        });
        
        // 5. Notification
        // Notify the mechanic that their booking has been cancelled
        await this.notificationGateway.emitBookingCancelled(booking.mechanicId, booking.id);
        this.logger.log(`[cancelBooking] Mechanic ${booking.mechanicId} notified of cancellation.`);


        this.logger.log(`[cancelBooking] Successfully cancelled booking ${id}`);
        // 💡 CONSOLE LOG: Success
        console.log(`[cancelBooking] Booking ${id} successfully CANCELLED.`);

        return updatedBooking;
    } catch (err) {
        this.logger.error(`Failed to cancel booking ID ${id}. Error: ${err.message}`, err.stack);
        
        // Re-throw specific client errors
        if (err instanceof NotFoundException || err instanceof ForbiddenException) {
            throw err;
        }
        
        // This InternalServerErrorException now covers both database issues AND payment/notification failures.
        throw new InternalServerErrorException('Failed to cancel booking or process refund.');
    }
}
}