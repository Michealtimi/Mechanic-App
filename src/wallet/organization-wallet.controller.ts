import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { OrganizationWalletService } from './organization-wallet.service';
import { JwtAuthGuard } from 'src/auth/guard/jwt.guard';
import { RolesGuard } from 'src/common/guard/roles.guards';
import { Roles } from 'src/common/decorators/roles.decorators';
import { Role } from '@prisma/client';
import {
  TransferFundsDto,
  CreditOrgWalletDto,
  DebitOrgWalletDto,
  BulkPaymentDto,
  OrganizationWalletResponseDto,
  WalletTransactionResponseDto,
} from './dto/organization-wallet.dto';
import { Decimal } from 'decimal.js';

@ApiTags('Organization Wallets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('wallets/organizations')
export class OrganizationWalletController {
  constructor(private readonly orgWalletService: OrganizationWalletService) {}

  @Get(':orgId/balance')
  @Roles(Role.ADMIN, Role.SUPERADMIN, Role.MECHANIC)
  @ApiOperation({ summary: 'Get organization wallet balance' })
  @ApiParam({ name: 'orgId', description: 'Organization ID' })
  @ApiResponse({ status: 200, description: 'Wallet balance retrieved', type: OrganizationWalletResponseDto })
  async getBalance(@Param('orgId') orgId: string) {
    const balance = await this.orgWalletService.getBalance(orgId);
    return {
      orgId,
      balance: balance.balance.toNumber(),
      pending: balance.pending.toNumber(),
    };
  }

  @Post(':orgId/credit')
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Credit organization wallet' })
  @ApiParam({ name: 'orgId', description: 'Organization ID' })
  @ApiResponse({ status: 200, description: 'Wallet credited successfully' })
  async creditWallet(
    @Param('orgId') orgId: string,
    @Body() dto: CreditOrgWalletDto,
  ) {
    const wallet = await this.orgWalletService.creditWallet(
      orgId,
      new Decimal(dto.amount),
      dto.type,
      dto.bookingId,
      dto.metadata,
    );
    return {
      id: wallet.id,
      orgId: wallet.orgId,
      balance: wallet.balance.toNumber(),
      pending: wallet.pending.toNumber(),
    };
  }

  @Post(':orgId/debit')
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Debit organization wallet' })
  @ApiParam({ name: 'orgId', description: 'Organization ID' })
  @ApiResponse({ status: 200, description: 'Wallet debited successfully' })
  async debitWallet(
    @Param('orgId') orgId: string,
    @Body() dto: DebitOrgWalletDto,
  ) {
    const wallet = await this.orgWalletService.debitWallet(
      orgId,
      new Decimal(dto.amount),
      dto.type,
      dto.bookingId,
      dto.metadata,
    );
    return {
      id: wallet.id,
      orgId: wallet.orgId,
      balance: wallet.balance.toNumber(),
      pending: wallet.pending.toNumber(),
    };
  }

  @Post('transfer')
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Transfer funds between wallets' })
  @ApiResponse({ status: 200, description: 'Funds transferred successfully' })
  async transferFunds(@Body() dto: TransferFundsDto) {
    const result = await this.orgWalletService.transferFunds(
      dto.fromType,
      dto.fromId,
      dto.toType,
      dto.toId,
      new Decimal(dto.amount),
      dto.metadata,
    );
    return {
      fromBalance: result.fromBalance.toNumber(),
      toBalance: result.toBalance.toNumber(),
    };
  }

  @Get(':orgId/transactions')
  @Roles(Role.ADMIN, Role.SUPERADMIN, Role.MECHANIC)
  @ApiOperation({ summary: 'Get organization wallet transaction history' })
  @ApiParam({ name: 'orgId', description: 'Organization ID' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of transactions to return' })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Number of transactions to skip' })
  @ApiResponse({ status: 200, description: 'Transactions retrieved', type: [WalletTransactionResponseDto] })
  async getTransactions(
    @Param('orgId') orgId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    const result = await this.orgWalletService.getTransactions(
      orgId,
      limit ? parseInt(limit.toString()) : 50,
      offset ? parseInt(offset.toString()) : 0,
    );
    return {
      transactions: result.transactions.map((t) => ({
        ...t,
        amount: t.amount.toNumber(),
        balanceAfter: t.balanceAfter.toNumber(),
      })),
      total: result.total,
      limit: limit || 50,
      offset: offset || 0,
    };
  }

  @Post('bulk-payment')
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Process bulk payments from organization wallet' })
  @ApiResponse({ status: 200, description: 'Bulk payments processed' })
  async processBulkPayments(@Body() dto: BulkPaymentDto) {
    return await this.orgWalletService.processBulkPayments(
      dto.sourceOrgId,
      dto.recipients,
    );
  }

  @Get(':orgId/report')
  @Roles(Role.ADMIN, Role.SUPERADMIN, Role.MECHANIC)
  @ApiOperation({ summary: 'Get organization wallet report and statistics' })
  @ApiParam({ name: 'orgId', description: 'Organization ID' })
  @ApiQuery({ name: 'startDate', required: false, type: Date })
  @ApiQuery({ name: 'endDate', required: false, type: Date })
  @ApiResponse({ status: 200, description: 'Wallet report retrieved' })
  async getWalletReport(
    @Param('orgId') orgId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const report = await this.orgWalletService.getWalletReport(
      orgId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
    return {
      balance: report.balance.toNumber(),
      pending: report.pending.toNumber(),
      totalCredits: report.totalCredits.toNumber(),
      totalDebits: report.totalDebits.toNumber(),
      transactionCount: report.transactionCount,
      recentTransactions: report.recentTransactions.map((t) => ({
        ...t,
        amount: t.amount.toNumber(),
        balanceAfter: t.balanceAfter.toNumber(),
      })),
    };
  }
}
