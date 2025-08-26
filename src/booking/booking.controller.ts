/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
 
import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { BookingService } from './booking.service';

import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';

import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { RolesGuard } from 'src/common/guard/roles.guards';
import { CreateBookingDto } from './dto/creating-booking.dto';
import { BookingResponseDto } from './dto/bookingresponse.dto';
import { Roles } from 'src/common/decorators/roles.decorators';

@ApiTags('Bookings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('booking')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post('create')
  @Roles('CUSTOMER')
  @ApiOperation({ summary: 'Create a booking' })
  @ApiResponse({ status: 201, type: BookingResponseDto })
  async createBooking(@Request() req, @Body() dto: CreateBookingDto) {
    return this.bookingService.createBooking(dto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all bookings for logged-in user' })
  async getBookings(@Request() req) {
    return this.bookingService.getAllBookings(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get booking by ID' })
  @ApiParam({ name: 'id', example: 'uuid-booking' })
  async getBookingById(@Param('id') id: string, @Request() req) {
    return this.bookingService.getBookingById(id, req.user.id);
  }

  @Patch(':id/status')
  @Roles('MECHANIC')
  @ApiOperation({ summary: 'Update booking status (mechanic only)' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateBookingStatusDto,
    @Request() req,
  ) {
    return this.bookingService.updateBookingStatus(id, dto, req.user.id);
  }

  @Delete(':id')
  @Roles('CUSTOMER')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cancel booking (customer only)' })
  async cancelBooking(@Param('id') id: string, @Request() req) {
    return this.bookingService.cancelBooking(id, req.user.id);
  }
}
