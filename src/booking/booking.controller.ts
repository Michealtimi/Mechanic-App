// src/booking/booking.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
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
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { BookingService } from './booking.service';
import {
  CreateBookingDto,
  UpdateBookingStatusDto,
  BookingFilterDto,
  BookingResponseDto, // Import the new consolidated response DTO
} from './dto/booking.dto'; // Import from the new consolidated DTO file
import { JwtAuthGuard } from 'src/auth/guard/jwt.guard';
import { RolesGuard } from 'src/common/guard/roles.guards';
import { Roles } from 'src/common/decorators/roles.decorators';
import { Role } from '@prisma/client';
import { plainToInstance } from 'class-transformer'; // Needed for manual transformation if not using ClassSerializerInterceptor globally

@ApiTags('Bookings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard) // Apply guards at controller level
@UseInterceptors(ClassSerializerInterceptor) // Apply serializer globally to this controller
@Controller('bookings')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post()
  @Roles(Role.CUSTOMER) // Only customers can create bookings
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new booking',
    description: 'Creates a new booking with support for multi-segment bookings. Can create single-segment (backward compatible) or multi-segment bookings.',
  })
  @ApiBody({ type: CreateBookingDto })
  @ApiResponse({
    status: 201,
    description: 'Booking created successfully',
    type: BookingResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Service not found' })
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
  @ApiOperation({
    summary: 'Get all bookings',
    description: 'Retrieves all bookings for the authenticated user (customer or mechanic) with optional filtering and pagination. Includes segments in the response.',
  })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] })
  @ApiQuery({ name: 'skip', required: false, type: Number, description: 'Number of items to skip for pagination' })
  @ApiQuery({ name: 'take', required: false, type: Number, description: 'Number of items to take for pagination' })
  @ApiResponse({
    status: 200,
    description: 'Bookings retrieved successfully',
    type: [BookingResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
  @ApiOperation({
    summary: 'Get booking by ID',
    description: 'Retrieves a specific booking by ID with all segments, payments, and related data.',
  })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  @ApiResponse({
    status: 200,
    description: 'Booking retrieved successfully',
    type: BookingResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async getBookingById(@Param('id') id: string, @Req() req) {
    const userId = req.user.id;
    const booking = await this.bookingService.getBookingById(id, userId);
    return plainToInstance(BookingResponseDto, booking, { excludeExtraneousValues: true });
  }

  @Get(':id/receipt')
  @ApiOperation({
    summary: 'Get job receipt (Invisible Foreman)',
    description: 'Returns Vehicle Health Certificate image URL for EV jobs (for WhatsApp share).',
  })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  @ApiResponse({ status: 200, description: 'Receipt image URL' })
  @ApiResponse({ status: 404, description: 'Receipt not found (non-EV or not completed)' })
  async getReceipt(@Param('id') id: string, @Req() req) {
    const userId = req.user.id;
    return this.bookingService.getReceipt(id, userId);
  }

  @Put(':id/status')
  @Roles(Role.MECHANIC) // Only mechanics can update booking status
  @ApiOperation({
    summary: 'Update booking status',
    description: 'Updates the overall status of a booking. Only mechanics assigned to the booking can update the status.',
  })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  @ApiBody({ type: UpdateBookingStatusDto })
  @ApiResponse({
    status: 200,
    description: 'Booking status updated successfully',
    type: BookingResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not authorized to update this booking' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async updateBookingStatus(@Param('id') id: string, @Body() updateBookingStatusDto: UpdateBookingStatusDto, @Req() req) {
    const mechanicId = req.user.id;
    const updatedBooking = await this.bookingService.updateBookingStatus(id, updateBookingStatusDto, mechanicId);
    // `ClassSerializerInterceptor` will handle the transformation
    return plainToInstance(BookingResponseDto, updatedBooking, { excludeExtraneousValues: true });
  }

  @Put(':id/cancel') // Using PUT for cancellation as it's an update
  @Roles(Role.CUSTOMER) // Only customer can cancel their own booking (or admin)
  @ApiOperation({
    summary: 'Cancel booking',
    description: 'Cancels a booking. Only the customer who created the booking can cancel it. Refunds are processed if payment was made.',
  })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  @ApiResponse({
    status: 200,
    description: 'Booking cancelled successfully',
    type: BookingResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async cancelBooking(@Param('id') id: string, @Req() req) {
    const customerId = req.user.id;
    const cancelledBooking = await this.bookingService.cancelBooking(id, customerId);
    // `ClassSerializerInterceptor` will handle the transformation
    return plainToInstance(BookingResponseDto, cancelledBooking, { excludeExtraneousValues: true });
  }

  // --- SEGMENT-SPECIFIC ENDPOINTS ---

  @Post(':id/segments/:segmentId/assign')
  @Roles(Role.MECHANIC, Role.ADMIN) // Mechanics and admins can assign segments
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Assign mechanic to segment',
    description: 'Assigns a mechanic to a specific booking segment. Allows different mechanics to handle different services within the same booking.',
  })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  @ApiParam({ name: 'segmentId', description: 'Segment ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        mechanicId: { type: 'string', description: 'Mechanic ID (optional, defaults to current user)' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Mechanic assigned to segment successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid mechanic ID' })
  @ApiResponse({ status: 404, description: 'Segment not found' })
  async assignSegmentToMechanic(
    @Param('id') bookingId: string,
    @Param('segmentId') segmentId: string,
    @Body() body: { mechanicId: string },
    @Req() req,
  ) {
    const userId = req.user.id;
    const mechanicId = body.mechanicId || userId; // Use provided mechanicId or current user
    const segment = await this.bookingService.assignSegmentToMechanic(segmentId, mechanicId);
    return segment;
  }

  @Patch(':id/segments/:segmentId/status')
  @Roles(Role.MECHANIC, Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update segment status',
    description: 'Updates the status of a specific booking segment. Statuses: PENDING, ASSIGNED, IN_PROGRESS, COMPLETED, FAILED, CANCELLED.',
  })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  @ApiParam({ name: 'segmentId', description: 'Segment ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED'],
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Segment status updated successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Not authorized to update this segment' })
  @ApiResponse({ status: 404, description: 'Segment not found' })
  async updateSegmentStatus(
    @Param('id') bookingId: string,
    @Param('segmentId') segmentId: string,
    @Body() body: { status: string },
    @Req() req,
  ) {
    const mechanicId = req.user.id;
    const segment = await this.bookingService.updateSegmentStatus(
      segmentId,
      body.status as any, // SegmentStatus enum
      mechanicId,
    );
    return segment;
  }

  @Post(':id/segments/:segmentId/complete')
  @Roles(Role.MECHANIC)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Complete segment',
    description: 'Marks a booking segment as completed. This triggers payment release for the segment if payment is in escrow.',
  })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  @ApiParam({ name: 'segmentId', description: 'Segment ID' })
  @ApiResponse({
    status: 200,
    description: 'Segment completed successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Not authorized to complete this segment' })
  @ApiResponse({ status: 404, description: 'Segment not found' })
  async completeSegment(
    @Param('id') bookingId: string,
    @Param('segmentId') segmentId: string,
    @Req() req,
  ) {
    const mechanicId = req.user.id;
    const segment = await this.bookingService.completeSegment(segmentId, mechanicId);
    return segment;
  }

  @Post(':id/request-completion')
  @Roles(Role.MECHANIC)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request completion PIN (Invisible Foreman)',
    description: 'Mechanic requests a 4-digit PIN to show to customer/Fleet Manager. Use verify-completion to complete and release payment.',
  })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  @ApiResponse({ status: 200, description: 'PIN generated; show to customer to enter in verify-completion' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async requestCompletion(@Param('id') id: string, @Req() req) {
    const mechanicId = req.user.id;
    return this.bookingService.requestCompletionPin(id, mechanicId);
  }

  @Post(':id/verify-completion')
  @Roles(Role.CUSTOMER, Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify completion PIN (Invisible Foreman)',
    description: 'Customer or Fleet Manager enters the 4-digit PIN to confirm satisfaction. Completes booking and releases payment to mechanic.',
  })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['pin'],
      properties: { pin: { type: 'string', description: '4-digit PIN from mechanic app' } },
    },
  })
  @ApiResponse({ status: 200, description: 'Booking completed and payment released' })
  @ApiResponse({ status: 400, description: 'Invalid or expired PIN' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async verifyCompletion(
    @Param('id') id: string,
    @Body() body: { pin: string },
    @Req() req,
  ) {
    const userId = req.user.id;
    return this.bookingService.verifyCompletionPin(id, body.pin, userId);
  }

  @Post(':id/arrived')
  @Roles(Role.MECHANIC)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mark mechanic arrived (Invisible Foreman)',
    description: 'Mechanic marks arrival at job location. Geofence check: must be within configured radius of pickup.',
  })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  @ApiResponse({ status: 200, description: 'Booking set to IN_PROGRESS' })
  @ApiResponse({ status: 400, description: 'Too far from job location' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async mechanicArrived(@Param('id') id: string, @Req() req) {
    const mechanicId = req.user.id;
    const booking = await this.bookingService.mechanicArrived(id, mechanicId);
    return plainToInstance(BookingResponseDto, booking, { excludeExtraneousValues: true });
  }
}