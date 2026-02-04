import {
  Controller,
  Post,
  Body,
  Param,
  Patch,
  Get,
  Query,
  UsePipes,
  ValidationPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import { PayoutService } from './payout.service';
import {
  RequestPayoutDto,
  UpdatePayoutStatusDto,
  ListPayoutsDto,
  PayoutResponseDto,
} from './dtos/payout.dtos';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guard/jwt.guard'; // Assuming you have an auth guard
import { RolesGuard } from 'src/common/guard/roles.guards'; // Assuming a roles guard
import { Roles } from 'src/common/decorators/roles.decorators'; // Assuming roles decorator
import { Role } from '@prisma/client'; // Assuming Role enum
import { plainToInstance } from 'class-transformer'; // For transforming service response to DTO
import { UserRequest } from 'src/common/interfaces/user-request.interface'; // Assuming this interface exists for @Req() user

@ApiTags('Payouts')
@Controller('payouts')
// Apply ValidationPipe globally for this controller
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
export class PayoutController {
  constructor(private readonly payoutService: PayoutService) {}

  /**
   * Endpoint for a mechanic to request a payout.
   */
  @Post('request')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MECHANIC)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Request a payout from a mechanic wallet' })
  @ApiBody({ type: RequestPayoutDto, description: 'Payout request details' })
  @ApiResponse({
    status: 201,
    description: 'Payout request initiated successfully.',
    type: PayoutResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request (e.g., validation failed, insufficient balance)' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden (only mechanics can request payouts)' })
  @ApiResponse({ status: 404, description: 'Mechanic not found' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async requestPayout(
    @Req() req: UserRequest, // Assuming req.user contains the authenticated user's details
    @Body() dto: RequestPayoutDto,
  ): Promise<PayoutResponseDto> {
    const mechanicId = req.user.id; // Get mechanic ID from authenticated user
    const result = await this.payoutService.requestPayout(mechanicId, dto);
    // Return the data part of the result, transformed to PayoutResponseDto
    return plainToInstance(PayoutResponseDto, result.data, { excludeExtraneousValues: true });
  }

  /**
   * Endpoint for the payment gateway (webhook) to notify of a payout's final status.
   * This would typically be an unauthenticated endpoint, but with a secure signature verification.
   * For this example, we'll assume a basic approach, but in production, it needs webhook security.
   * This is called by the `PaymentsService` or a dedicated webhook listener.
   */
  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update payout status (typically by webhook or internal system)',
    description: 'This endpoint is typically called by a payment gateway webhook or an internal process to update the final status of a payout.',
  })
  @ApiParam({ name: 'id', description: 'ID of the payout to update', type: 'string' })
  @ApiBody({ type: UpdatePayoutStatusDto, description: 'New status and relevant details' })
  @ApiResponse({
    status: 200,
    description: 'Payout status updated successfully.',
    type: PayoutResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request (e.g., validation failed, invalid status transition)' })
  @ApiResponse({ status: 404, description: 'Payout not found' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  // @UseGuards(WebhookAuthGuard) // <--- In a real app, use a custom guard for webhook signature verification
  async markPayoutResult(
    @Param('id') payoutId: string,
    @Body() dto: UpdatePayoutStatusDto,
  ): Promise<PayoutResponseDto> {
    const updatedPayout = await this.payoutService.markPayoutResult(payoutId, dto);
    return plainToInstance(PayoutResponseDto, updatedPayout, { excludeExtraneousValues: true });
  }

  /**
   * Admin endpoint to get details of a specific payout.
   */
  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN, Role.MECHANIC) // Mechanic can view their own payouts
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get details of a specific payout' })
  @ApiParam({ name: 'id', description: 'ID of the payout', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Payout details retrieved successfully.',
    type: PayoutResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Payout not found' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async getPayout(
    @Param('id') payoutId: string,
    @Req() req: UserRequest,
  ): Promise<PayoutResponseDto> {
    const payout = await this.payoutService.getPayout(payoutId);

    if (!payout) {
      throw new NotFoundException(`Payout with ID ${payoutId} not found.`);
    }

    // Authorization check: Mechanics can only view their own payouts
    if (req.user.role === Role.MECHANIC && payout.mechanicId !== req.user.id) {
        throw new HttpStatus(HttpStatus.FORBIDDEN, 'You are not authorized to view this payout.');
    }

    return plainToInstance(PayoutResponseDto, payout, { excludeExtraneousValues: true });
  }

  /**
   * Admin endpoint to list all payouts with filtering and pagination.
   */
  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN) // Only admins and superadmins can list all payouts
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all payouts with optional filtering and pagination' })
  @ApiQuery({ name: 'mechanicId', type: 'string', required: false, description: 'Filter by mechanic ID' })
  @ApiQuery({ name: 'status', enum: PayoutStatus, required: false, description: 'Filter by payout status' })
  @ApiQuery({ name: 'page', type: 'number', required: false, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', type: 'number', required: false, description: 'Items per page', example: 10 })
  @ApiResponse({
    status: 200,
    description: 'List of payouts retrieved successfully.',
    type: [PayoutResponseDto],
  })
  @ApiResponse({ status: 400, description: 'Bad Request (e.g., validation failed for query parameters)' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden (only admins can list all payouts)' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async listPayouts(
    @Query() filters: ListPayoutsDto, // Using the DTO for query parameters
  ): Promise<{ data: PayoutResponseDto[]; total: number; page: number; limit: number }> {
    const { data, total, page, limit } = await this.payoutService.listPayouts(filters);
    const transformedData = plainToInstance(PayoutResponseDto, data, { excludeExtraneousValues: true });
    return { data: transformedData, total, page, limit };
  }
}