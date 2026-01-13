/* eslint-disable prettier/prettier */
import { Controller, Post, Body, UseGuards, Req, Param, Patch } from '@nestjs/common';
import { DispatchService } from './dispatch.service';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger'; // Added ApiBearerAuth, ApiBody
import { JwtAuthGuard } from 'src/auth/jwt.guard';import { IsOptional, IsString } from 'class-validator'; // For RejectDto
import { CreateDispatchDto } from './dispatch.dto';
import { User } from '@prisma/client';
/**
 * DTO for Dispatch Rejection
 */
class RejectDispatchDto {
    @IsOptional()
    @IsString()
    reason?: string;
}


@ApiTags('Dispatch')
@ApiBearerAuth() // Indicates that authentication is required for all endpoints
@Controller('dispatch')
export class DispatchController {
  constructor(private readonly dispatchService: DispatchService) {}

  // 1. CREATE DISPATCH (Initiates Assignment)
  // Used by an administrator or the system to assign a job.
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Assign a mechanic to a booking (auto-match or specific manual assignment)' })
  async create(@Req() req: User, @Body() dto: CreateDispatchDto) {
    // req.user.id is the ID of the entity initiating the dispatch (e.g., an Admin or the system itself)
    const user= req.user.id; 
    return this.dispatchService.createDispatch(dto, user);
  }

  // 2. ACCEPT DISPATCH
  // Used by a MECHANIC to accept an assigned job.
  @Patch(':id/accept')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Mechanic accepts a dispatch assignment, confirming the booking' })
  async accept(@Req() req: UserRequest, @Param('id') id: string) {
    // req.user.id must be the mechanic's ID
    const mechanicId = req.user.id;
    return this.dispatchService.acceptDispatch(id, mechanicId);
  }

  // 3. REJECT DISPATCH
  // Used by a MECHANIC to reject an assigned job.
  @Patch(':id/reject')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Mechanic rejects a dispatch assignment' })
  @ApiBody({ type: RejectDispatchDto, required: false, description: 'Optional reason for rejection' })
  async reject(@Req() req: UserRequest, @Param('id') id: string, @Body() body: RejectDispatchDto) {
    // req.user.id must be the mechanic's ID
    const mechanicId = req.user.id;
    return this.dispatchService.rejectDispatch(id, mechanicId, body?.reason);
  }
}