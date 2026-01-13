// src/dispute/dispute.controller.ts (Updated)

import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  UseGuards,
  Req,
  Patch,
  HttpCode,
  HttpStatus,
  ValidationPipe, // <-- Import ValidationPipe
  UsePipes, // <-- Import UsePipes
} from '@nestjs/common';
import { DisputeService } from './dispute.service';
import { JwtAuthGuard } from 'src/auth/guard/jwt.guard';
import { RolesGuard } from 'src/common/guard/roles.guards';
import { Roles } from 'src/common/decorators/roles.decorators';
import { Role } from '@prisma/client';
import {
  RaiseDisputeDto,
  ResolveDisputeDto,
  DisputeResponseDto, // <-- Import response DTO
} from './dto/dispute.dto'; // <-- New DTO file path
import { ApiTags, ApiResponse, ApiOperation, ApiBody } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer'; // <-- Import plainToInstance

@ApiTags('Disputes')
@UseGuards(JwtAuthGuard) // Apply global guard for all dispute routes
@Controller('disputes')
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })) // Apply validation pipe
export class DisputeController {
  constructor(private readonly disputeService: DisputeService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Raise a new dispute for a booking' })
  @ApiBody({ type: RaiseDisputeDto })
  @ApiResponse({ status: 201, description: 'Dispute raised successfully', type: DisputeResponseDto })
  @ApiResponse({ status: 400, description: 'Bad Request (e.g., validation failed, pending dispute exists)' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  @ApiResponse({ status: 403, description: 'Forbidden (e.g., pending dispute already exists for this booking)' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async raiseDispute(@Body() dto: RaiseDisputeDto, @Req() req): Promise<DisputeResponseDto> {
    const userId = req.user.id; // Assuming req.user is populated by JwtAuthGuard
    const dispute = await this.disputeService.raiseDispute(userId, dto.bookingId, dto.reason);
    return plainToInstance(DisputeResponseDto, dispute, { excludeExtraneousValues: true });
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all pending disputes (Admin/SuperAdmin only)' })
  @ApiResponse({ status: 200, description: 'List of disputes retrieved successfully', type: [DisputeResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden (requires ADMIN or SUPERADMIN role)' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async listAllDisputes(): Promise<DisputeResponseDto[]> {
    const disputes = await this.disputeService.listAll();
    return plainToInstance(DisputeResponseDto, disputes, { excludeExtraneousValues: true });
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a single dispute by ID (Admin/SuperAdmin only)' })
  @ApiResponse({ status: 200, description: 'Dispute retrieved successfully', type: DisputeResponseDto })
  @ApiResponse({ status: 404, description: 'Dispute not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden (requires ADMIN or SUPERADMIN role)' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async getDisputeById(@Param('id') id: string): Promise<DisputeResponseDto> {
    const dispute = await this.disputeService.getDisputeById(id);
    if (!dispute) {
      throw new NotFoundException(`Dispute with ID ${id} not found.`);
    }
    return plainToInstance(DisputeResponseDto, dispute, { excludeExtraneousValues: true });
  }


  @Patch(':id/resolve')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resolve a specific dispute (Admin/SuperAdmin only)' })
  @ApiBody({ type: ResolveDisputeDto })
  @ApiResponse({ status: 200, description: 'Dispute resolved successfully', type: DisputeResponseDto })
  @ApiResponse({ status: 400, description: 'Bad Request (e.g., validation failed, invalid refund amount)' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden (e.g., dispute already resolved, insufficient permissions)' })
  @ApiResponse({ status: 404, description: 'Dispute not found' })
  @ApiResponse({ status: 500, description: 'Internal Server Error (e.g., financial transaction failed)' })
  async resolveDispute(@Param('id') id: string, @Body() dto: ResolveDisputeDto): Promise<DisputeResponseDto> {
    const resolvedDispute = await this.disputeService.resolveDispute(
      id,
      dto.resolution,
      dto.refundAmount,
      dto.isRefundToCustomer,
      dto.isDebitMechanic,
    );
    return plainToInstance(DisputeResponseDto, resolvedDispute, { excludeExtraneousValues: true });
  }
}