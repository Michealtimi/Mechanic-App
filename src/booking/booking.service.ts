/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable prettier/prettier */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { plainToInstance } from 'class-transformer';
import { CreateBookingDto } from './dto/creating-booking.dto';
import { BookingResponseDto } from './dto/bookingresponse.dto';


@Injectable()
export class BookingService {
  constructor(private readonly prisma: PrismaService) {}

  async createBooking(dto: CreateBookingDto, customerId: string) {
    try {
      const mechanic = await this.prisma.user.findUnique({
        where: { id: dto.mechanicId },
      });
      if (!mechanic) throw new NotFoundException('Mechanic not found');

      const service = await this.prisma.mechanicService.findUnique({
        where: { id: dto.serviceId },
      });
      if (!service) throw new NotFoundException('Service not found');

      if (service.mechanicId !== dto.mechanicId) {
        throw new ForbiddenException('Service does not belong to this mechanic');
      }

      const existingBooking = await this.prisma.booking.findFirst({
        where: { scheduledAt: dto.scheduledAt, mechanicId: dto.mechanicId },
      });
      if (existingBooking) {
        throw new ConflictException('Time slot already booked');
      }

      const booking = await this.prisma.booking.create({
        data: {
          customerId,
          mechanicId: dto.mechanicId,
          serviceId: dto.serviceId,
          scheduledAt: new Date(dto.scheduledAt),
          status: dto.status || 'PENDING',
        },
      });

      return {
        success: true,
        message: 'Booking created successfully',
        data: plainToInstance(BookingResponseDto, booking, {
          excludeExtraneousValues: true,
        }),
      };
    } catch (error) {
      throw new InternalServerErrorException(error.message || 'Booking creation failed');
    }
  }

  async getAllBookings(userId: string) {
    try {
      const bookings = await this.prisma.booking.findMany({
        where: { OR: [{ mechanicId: userId }, { customerId: userId }] },
      });

      return {
        success: true,
        message: 'Bookings retrieved successfully',
        data: plainToInstance(BookingResponseDto, bookings, {
          excludeExtraneousValues: true,
        }),
      };
    } catch (error) {
      throw new InternalServerErrorException(error.message || 'Failed to retrieve bookings');
    }
  }

  async getBookingById(id: string, userId: string) {
    try {
      const booking = await this.prisma.booking.findUnique({ where: { id } });
      if (!booking) throw new NotFoundException('Booking not found');

      if (booking.customerId !== userId && booking.mechanicId !== userId) {
        throw new ForbiddenException('You do not have access to this booking');
      }

      return {
        success: true,
        message: 'Booking retrieved successfully',
        data: plainToInstance(BookingResponseDto, booking, {
          excludeExtraneousValues: true,
        }),
      };
    } catch (error) {
      throw new InternalServerErrorException(error.message || 'Failed to retrieve booking');
    }
  }

  async updateBookingStatus(id: string, dto: UpdateBookingStatusDto, mechanicId: string) {
    try {
      const booking = await this.prisma.booking.findUnique({ where: { id } });
      if (!booking) throw new NotFoundException('Booking not found');

      if (booking.mechanicId !== mechanicId) {
        throw new ForbiddenException('You cannot update this booking');
      }

      const updatedBooking = await this.prisma.booking.update({
        where: { id },
        data: { status: dto.status },
      });

      return {
        success: true,
        message: 'Booking status updated successfully',
        data: plainToInstance(BookingResponseDto, updatedBooking, {
          excludeExtraneousValues: true,
        }),
      };
    } catch (error) {
      throw new InternalServerErrorException(error.message || 'Failed to update booking status');
    }
  }

  async cancelBooking(id: string, customerId: string) {
    try {
      const booking = await this.prisma.booking.findUnique({ where: { id } });
      if (!booking) throw new NotFoundException('Booking not found');

      if (booking.customerId !== customerId) {
        throw new ForbiddenException('You cannot cancel this booking');
      }

      await this.prisma.booking.update({
        where: { id },
        data: { status: 'CANCELLED' },
      });

      return {
        success: true,
        message: 'Booking cancelled successfully',
        data: null,
      };
    } catch (error) {
      throw new InternalServerErrorException(error.message || 'Failed to cancel booking');
    }
  }
}
