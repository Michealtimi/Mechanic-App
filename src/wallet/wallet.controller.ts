// src/modules/wallet/wallet.controller.ts

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  InternalServerErrorException,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { WalletService } from './wallet.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guard/jwt.guard';
import { RolesGuard } from 'src/common/guard/roles.guards';
import { Roles } from 'src/common/decorators/roles.decorators';
import { Role } from '@prisma/client';

export class DebitWalletDto {
  amount: number;
  type?: string;
  bookingId?: string;
}

@ApiTags('Wallet')
@Controller('wallet')
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  // ===============================
  // 1. ENSURE WALLET EXISTS (NEW ENDPOINT) 🚀
  // ===============================
  @Post('ensure')
  @HttpCode(200)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Guarantees wallet existence for the authenticated user.', 
    description: 'Creates a wallet if one does not exist for the user, otherwise returns the existing wallet. Idempotent operation.' 
  })
  @ApiResponse({ status: 200, description: 'Wallet created or retrieved successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async ensureUserWallet(@Request() req) {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException('Authentication required');
    return this.walletService.ensureWallet(userId);
  }

  // ===============================
  // 2. GET USER WALLET AND HISTORY (REST OF THE CONTROLLER)
  // ===============================
  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retrieve the authenticated user\'s wallet details and transaction history.' })
  @ApiResponse({ status: 200, description: 'Wallet retrieved successfully.' })
  async getMyWallet(@Request() req) {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException('Authentication required');
    const wallet = await this.walletService.getWallet(userId);
    if (!wallet) {
        throw new NotFoundException('Wallet not found for this user. Consider calling /wallet/ensure.');
    }
    return wallet;
  }

  @Get('transactions')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get paginated transaction history for the authenticated user.' })
  @ApiResponse({ status: 200, description: 'Paginated transactions.' })
  async getTransactions(
    @Request() req,
    @Query('page') pageStr?: string,
    @Query('limit') limitStr?: string,
  ) {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException('Authentication required');
    const page = Math.max(1, parseInt(pageStr || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(limitStr || '20', 10)));
    return this.walletService.getTransactions(userId, page, limit);
  }

  @Get('escrow')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get escrow summary (amount held, pending payouts).' })
  @ApiResponse({ status: 200, description: 'Escrow summary.' })
  async getEscrow(@Request() req) {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException('Authentication required');
    return this.walletService.getEscrow(userId);
  }

  // ... (creditMechanic and debitWallet methods remain the same) ...

  // =======================================================
  // 3. INTERNAL ENDPOINT: Credit (Mechanic Payouts, Refunds)
  // =======================================================
  @Post('credit/:mechanicId')
  @HttpCode(200)
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'INTERNAL/SYSTEM: Credit a mechanic\'s wallet. Admin/Superadmin only. Amount in kobo/cents.' })
  @ApiResponse({ status: 200, description: 'Wallet credited successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden. Admin or Superadmin only.' })
  async creditMechanic(
    @Param('mechanicId') mechanicId: string, 
    @Body('amount') amount: number, // Expecting amount in kobo/cents
    @Body('bookingId') bookingId?: string
  ) {
    if (!amount || amount <= 0) {
      throw new BadRequestException('Credit amount must be a positive number.');
    }
    return this.walletService.creditMechanic(mechanicId, amount, bookingId);
  }


  // ========================================================
  // 4. INTERNAL ENDPOINT: Debit (System Fees, Service Payment)
  // ========================================================
  @Post('debit')
  @HttpCode(200)
  @ApiOperation({ summary: 'INTERNAL/SYSTEM: Debit the authenticated user\'s wallet.' })
  @ApiResponse({ status: 200, description: 'Wallet debited successfully.' })
  @ApiResponse({ status: 400, description: 'Insufficient balance or bad request.' })
  async debitWallet(@Request() req, @Body() dto: DebitWalletDto) {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException('Authentication required');
    if (dto.amount <= 0) {
      throw new BadRequestException('Debit amount must be a positive number.');
    }

    try {
      return await this.walletService.debitWallet(userId, dto.amount, dto.type, dto.bookingId);
    } catch (e) {
      if (e instanceof InternalServerErrorException && e.message.includes('Insufficient balance')) {
        throw new BadRequestException('Insufficient funds in wallet.');
      }
      throw e;
    }
  }
}