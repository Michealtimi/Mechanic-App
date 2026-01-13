// src/booking/booking.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { BookingService } from './booking.service';
import {
  CreateBookingDto,
  UpdateBookingStatusDto,
  BookingFilterDto,
  BookingResponseDto, // Import the new consolidated response DTO
} from './dto/booking.dto'; // Import from the new consolidated DTO file
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { plainToInstance } from 'class-transformer'; // Needed for manual transformation if not using ClassSerializerInterceptor globally

@UseGuards(JwtAuthGuard, RolesGuard) // Apply guards at controller level
@UseInterceptors(ClassSerializerInterceptor) // Apply serializer globally to this controller
@Controller('bookings')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post()
  @Roles(Role.CUSTOMER) // Only customers can create bookings
  @HttpCode(HttpStatus.CREATED)
  async createBooking(@Body() createBookingDto: CreateBookingDto, @Req() req) {
    const customerId = req.user.id;
    const { booking, payment } = await this.bookingService.createBooking(createBookingDto, customerId);
    // The service returns { booking, payment }, we want to serialize the booking part
    // The `ClassSerializerInterceptor` will automatically call `plainToInstance` for `booking`
    // but you might need to structure your return to specifically return the serialized booking.
    // Let's return the booking part, and if needed, the payment as a nested object
    return plainToInstance(BookingResponseDto, booking, { excludeExtraneousValues: true });
  }

  @Get()
  async getAllBookings(@Req() req, @Query() filterDto: BookingFilterDto) {
    const userId = req.user.id;
    const { data, meta } = await this.bookingService.getAllBookings(userId, filterDto);
    // `ClassSerializerInterceptor` will handle the transformation of `data` if `data` is an array of plain objects
    return {
      data: plainToInstance(BookingResponseDto, data, { excludeExtraneousValues: true }),
      meta,
    };
  }

  @Get(':id')
  async getBookingById(@Param('id') id: string, @Req() req) {
    const userId = req.user.id;
    const booking = await this.bookingService.getBookingById(id, userId);
    // `ClassSerializerInterceptor` will handle the transformation
    return plainToInstance(BookingResponseDto, booking, { excludeExtraneousValues: true });
  }

  @Put(':id/status')
  @Roles(Role.MECHANIC) // Only mechanics can update booking status
  async updateBookingStatus(@Param('id') id: string, @Body() updateBookingStatusDto: UpdateBookingStatusDto, @Req() req) {
    const mechanicId = req.user.id;
    const updatedBooking = await this.bookingService.updateBookingStatus(id, updateBookingStatusDto, mechanicId);
    // `ClassSerializerInterceptor` will handle the transformation
    return plainToInstance(BookingResponseDto, updatedBooking, { excludeExtraneousValues: true });
  }

  @Put(':id/cancel') // Using PUT for cancellation as it's an update
  @Roles(Role.CUSTOMER) // Only customer can cancel their own booking (or admin)
  async cancelBooking(@Param('id') id: string, @Req() req) {
    const customerId = req.user.id;
    const cancelledBooking = await this.bookingService.cancelBooking(id, customerId);
    // `ClassSerializerInterceptor` will handle the transformation
    return plainToInstance(BookingResponseDto, cancelledBooking, { excludeExtraneousValues: true });
  }
}