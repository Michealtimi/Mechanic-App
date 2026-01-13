// src/modules/admin/admin.controller.ts

import { Controller, Get, Patch, Param, Body, UseGuards, HttpCode, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guard/jwt.guard';
import { Role } from '@prisma/client';
// ⬅️ NEW: Assuming DTOs for cleaner body payload and querying
import { ResolveDisputeDto, RefundPaymentDto, QueryDisputesDto, QueryWalletsDto } from './admin.dto'; 
import { AdminService } from './admin.service.';
import { RolesGuard } from 'src/common/guard/roles.guards';
import { Roles } from 'src/common/decorators/roles.decorators';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard) // ⬅️ Added RolesGuard
@Controller('admin')
@Roles(Role.ADMIN, Role.SUPERADMIN)
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  // --------------------------------------------------
  // 1. DISPUTES
  // --------------------------------------------------

  @Get('disputes')
  @ApiOperation({ summary: 'Retrieve a list of all disputes (Paginated)' })
  @ApiResponse({ status: 200, description: 'List of disputes retrieved.' })
  @ApiQuery({ type: QueryDisputesDto }) // If adding pagination/filtering
  async listDisputes(@Query() query: QueryDisputesDto) { // ⬅️ Added Query for potential pagination
    return this.admin.listDisputes(query);
  }

  @Patch('disputes/:id/resolve')
  @HttpCode(200) // ⬅️ Explicitly set 200 OK for updates/resolutions
  @ApiOperation({ summary: 'Resolve a specific dispute, handling refunds/debits' })
  @ApiParam({ name: 'id', description: 'ID of the dispute' })
  @ApiBody({ type: ResolveDisputeDto }) // ⬅️ Use a DTO for cleaner input validation
  async resolveDispute(@Param('id') id: string, @Body() body: ResolveDisputeDto) {
    // ⚡ Refactored to pass DTO fields individually or the whole DTO
    return this.admin.resolveDispute(id, body);
  }

  // --------------------------------------------------
  // 2. WALLETS
  // --------------------------------------------------

  @Get('wallets')
  @ApiOperation({ summary: 'Retrieve a list of all user wallets (Paginated)' })
  @ApiResponse({ status: 200, description: 'List of wallets retrieved.' })
  @ApiQuery({ type: QueryWalletsDto }) // ⬅️ Added ApiQuery for QueryWalletsDto
  async listWallets(@Query() query: QueryWalletsDto) { // ⬅️ Added Query for potential pagination
    return this.admin.listWallets(query);
  }

  @Get('wallets/:id')
  @ApiOperation({ summary: 'Retrieve detailed information for a specific wallet' })
  @ApiParam({ name: 'id', description: 'ID of the wallet (e.g., user ID or wallet ID)' })
  async getWalletDetail(@Param('id') id: string) {
    return this.admin.getWalletDetail(id);
  }

  // --------------------------------------------------
  // 3. PAYMENTS & REFUNDS
  // --------------------------------------------------

  @Patch('payments/:id/refund')
  @HttpCode(200) 
  @ApiOperation({ summary: 'Process a refund for a payment' })
  @ApiParam({ name: 'id', description: 'ID of the payment record' })
  @ApiBody({ type: RefundPaymentDto }) // ⬅️ Use a DTO for cleaner input
  async refundPayment(@Param('id') id: string, @Body() body: RefundPaymentDto) {
    return this.admin.refundPayment(id, body.amount);
  }
}