// src/dispute/dispute.controller.ts (Updated)

import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  Query,
  UseGuards,
  Req,
  Patch,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  UsePipes,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DisputeService } from './dispute.service';
import { AiTriageService } from './ai-triage.service';
import { JwtAuthGuard } from 'src/auth/guard/jwt.guard';
import { RolesGuard } from 'src/common/guard/roles.guards';
import { Roles } from 'src/common/decorators/roles.decorators';
import { Role } from '@prisma/client';
import {
  RaiseDisputeDto,
  ResolveDisputeDto,
  EscalateDisputeDto,
  SetDisputePriorityDto,
  DisputeResponseDto,
} from './dto/dispute.dto';
import { ApiTags, ApiResponse, ApiOperation, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer'; // <-- Import plainToInstance

@ApiTags('Disputes')
@UseGuards(JwtAuthGuard) // Apply global guard for all dispute routes
@Controller('disputes')
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })) // Apply validation pipe
export class DisputeController {
  constructor(
    private readonly disputeService: DisputeService,
    private readonly aiTriageService: AiTriageService,
  ) {}

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
    const userId = req.user.id;
    if (!dto.bookingId) {
      throw new BadRequestException('bookingId is required.');
    }
    const dispute = await this.disputeService.raiseDispute(
      userId,
      dto.bookingId,
      dto.reason,
      dto.bookingSegmentId,
      dto.evidenceUrls,
    );
    return plainToInstance(DisputeResponseDto, dispute, { excludeExtraneousValues: true });
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all disputes (Admin/SuperAdmin only). Optional query param: ?status=PENDING' })
  @ApiResponse({ status: 200, description: 'List of disputes retrieved successfully', type: [DisputeResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden (requires ADMIN or SUPERADMIN role)' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async listAllDisputes(@Query('status') status?: string): Promise<DisputeResponseDto[]> {
    const disputes = await this.disputeService.listAll(status as any);
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

  @Post(':id/evidence')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add evidence to an existing dispute' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        evidenceUrls: {
          type: 'array',
          items: { type: 'string' },
          example: ['https://example.com/evidence1.jpg', 'https://example.com/evidence2.jpg'],
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Evidence added successfully', type: DisputeResponseDto })
  @ApiResponse({ status: 404, description: 'Dispute not found' })
  async addEvidence(
    @Param('id') id: string,
    @Body() body: { evidenceUrls: string[] },
  ): Promise<DisputeResponseDto> {
    const dispute = await this.disputeService.addEvidence(id, body.evidenceUrls);
    return plainToInstance(DisputeResponseDto, dispute, { excludeExtraneousValues: true });
  }

  @Post(':id/escalate')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Escalate a dispute to next level (Admin/SuperAdmin only)' })
  @ApiParam({ name: 'id', description: 'Dispute ID' })
  @ApiBody({ type: EscalateDisputeDto })
  @ApiResponse({ status: 200, description: 'Dispute escalated successfully', type: DisputeResponseDto })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 404, description: 'Dispute not found' })
  async escalateDispute(
    @Param('id') id: string,
    @Body() dto: EscalateDisputeDto,
    @Req() req,
  ): Promise<DisputeResponseDto> {
    const dispute = await this.disputeService.escalateDispute(
      id,
      req.user.id,
      dto.reason,
      dto.targetLevel,
    );
    return plainToInstance(DisputeResponseDto, dispute, { excludeExtraneousValues: true });
  }

  @Patch(':id/priority')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Set dispute priority (Admin/SuperAdmin only)' })
  @ApiParam({ name: 'id', description: 'Dispute ID' })
  @ApiBody({ type: SetDisputePriorityDto })
  @ApiResponse({ status: 200, description: 'Priority set successfully', type: DisputeResponseDto })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 404, description: 'Dispute not found' })
  async setPriority(
    @Param('id') id: string,
    @Body() dto: SetDisputePriorityDto,
    @Req() req,
  ): Promise<DisputeResponseDto> {
    const dispute = await this.disputeService.setPriority(id, dto.priority, req.user.id, dto.reason);
    return plainToInstance(DisputeResponseDto, dispute, { excludeExtraneousValues: true });
  }

  @Get('dashboard/stats')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Get dispute dashboard statistics (Admin/SuperAdmin only)' })
  @ApiResponse({ status: 200, description: 'Dashboard statistics retrieved' })
  async getDashboardStats(@Req() req): Promise<any> {
    return await this.disputeService.getDashboardStats(req.user.tenantId);
  }

  @Get('analytics')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Get dispute analytics (Admin/SuperAdmin only)' })
  @ApiQuery({ name: 'startDate', required: false, type: Date })
  @ApiQuery({ name: 'endDate', required: false, type: Date })
  @ApiResponse({ status: 200, description: 'Analytics retrieved' })
  async getAnalytics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Req() req?: any,
  ): Promise<any> {
    return await this.disputeService.getAnalytics(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      req?.user?.tenantId,
    );
  }

  @Post(':id/triage')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'AI-assisted dispute triage (Admin only)' })
  @ApiParam({ name: 'id', description: 'Dispute ID' })
  @ApiResponse({ status: 200, description: 'Triage completed' })
  async triageDispute(@Param('id') id: string) {
    return await this.aiTriageService.triageDispute(id);
  }

  @Post('batch-triage')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Batch triage multiple disputes (Admin only)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        disputeIds: {
          type: 'array',
          items: { type: 'string' },
          example: ['dispute-id-1', 'dispute-id-2'],
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Batch triage completed' })
  async batchTriage(@Body() body: { disputeIds: string[] }) {
    return await this.aiTriageService.batchTriage(body.disputeIds);
  }
}