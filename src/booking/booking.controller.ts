import { Body, Controller, Get, HttpCode, HttpStatus, Post, Request, UseGuards } from '@nestjs/common';
import { BookingService } from './booking.service'; // adjust path if needed
import { CreateBookingDto } from './dto/booking.dto';
import {
  ApiTags,
  ApiBearerAuth,
  ApiResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { RolesGuard } from 'src/common/guard/roles.guards';
import { bookingResponseDto } from './dto/bookingresponse.dto';


@ApiTags('booking')  // this is used to group the endpoints in Swagger UI
@ApiBearerAuth()  // this indicates that the endpoints require a JWT token for access
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('booking')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}
@ApiOperation({ summary: 'Create mechanic service' })  // groups endpoint in swagger ui
@ApiResponse({ type: bookingResponseDto ,status: 201, description: 'Booking Created created successfully' })  // gives a response to the client
@HttpCode(HttpStatus.CREATED)
@Post('create')
async createBooking(
  @Request() req,
  @Body() dto: CreateBookingDto, 
  
){
    const customerId = req.user.id;
    const booking = await this.bookingService.createBooking(dto, dto.serviceId, customerId);
    return booking;


}


@ApiOperation({ summary: 'Get all mechanic services' })
@ApiResponse({type: [bookingResponseDto], status: 200,  description: 'List of boookings' })
@Get()
async getMechanicBooking(@Request() req) {
  const id = req.user.id
  return this.bookingService.getMechanicBooking(id)
}

}