/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  UseGuards,
  Req,
  Patch,
} from '@nestjs/common';
import { DisputeService } from './dispute.service';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { RolesGuard } from 'src/common/guard/roles.guards';
import { Roles } from 'src/common/decorators/roles.decorators';
import { Role } from '@prisma/client';

class RaiseDisputeDto {
  bookingId: string;
  reason: string;
}

class ResolveDisputeDto {
  resolution: string;
  refundAmount: number;
  isRefundToCustomer: boolean;
  isDebitMechanic: boolean;
}

@UseGuards(JwtAuthGuard)
@Controller('disputes')
export class DisputeController {
  constructor(private readonly disputeService: DisputeService) {}

  @Post()
  raiseDispute(@Body() dto: RaiseDisputeDto, @Req() req) {
    const userId = req.user.id;
    return this.disputeService.raiseDispute(userId, dto.bookingId, dto.reason);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  listAllDisputes() {
    return this.disputeService.listAll();
  }

  @Patch(':id/resolve')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  resolveDispute(@Param('id') id: string, @Body() dto: ResolveDisputeDto) {
    return this.disputeService.resolveDispute(id, dto.resolution, dto.refundAmount, dto.isRefundToCustomer, dto.isDebitMechanic);
  }
}