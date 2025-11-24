// src/modules/subaccount/subaccount.controller.ts

import { Controller, Post, Get, Body, Param, UseGuards, Query, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';

import { SubaccountService } from './subaccount.service';
import { CreateSubaccountDto, QuerySubaccountsDto } from './subaccount.dto'; 

// --- Assuming these shared components exist ---
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import { Role } from '@prisma/client';
// ----------------------------------------------

@ApiTags('Subaccounts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard) // Secures all endpoints with authentication and role check
@Controller('subaccounts')
export class SubaccountController {
  constructor(private readonly subaccountService: SubaccountService) {}

  // --------------------------------------------------
  // 1. CREATE MECHANIC SUBACCOUNT (POST /subaccounts/mechanic)
  // --------------------------------------------------
  @Post('mechanic')
  @Roles(Role.MECHANIC) // Only mechanics can create their own subaccounts
  @HttpCode(201)
  @ApiOperation({ summary: 'Create a payment subaccount for the authenticated mechanic' })
  @ApiResponse({ status: 201, description: 'Subaccount successfully created and linked.' })
  @ApiResponse({ status: 403, description: 'Forbidden (User is not a MECHANIC).' })
  @ApiResponse({ status: 409, description: 'Conflict (Mechanic already has a subaccount).' })
  async createMechanicSubaccount(
    @Body() dto: CreateSubaccountDto,
    @GetUser('id') userId: string, // Extract user ID from the JWT token
  ) {
    return this.subaccountService.createMechanicSubaccount(userId, dto);
  }

  // --------------------------------------------------
  // 2. GET MECHANIC'S SUBACCOUNT (GET /subaccounts/mechanic)
  // --------------------------------------------------
  @Get('mechanic')
  @Roles(Role.MECHANIC) // Mechanic views their own subaccount
  @ApiOperation({ summary: 'Retrieve the subaccount details for the authenticated mechanic' })
  @ApiResponse({ status: 200, description: 'Subaccount details retrieved.' })
  @ApiResponse({ status: 404, description: 'Subaccount not found.' })
  async getMechanicSubaccount(
    @GetUser('id') userId: string,
  ) {
    return this.subaccountService.getSubaccount(userId);
  }

  // --------------------------------------------------
  // 3. GET ALL SUBACCOUNTS (GET /subaccounts) - PAGINATED
  // --------------------------------------------------
  @Get()
  @Roles(Role.ADMIN, Role.SUPERADMIN) // Restricted to high-privilege roles
  @ApiOperation({ summary: 'Retrieve a paginated list of all subaccounts (Admin/SuperAdmin only)' })
  @ApiResponse({ status: 200, description: 'A paginated list of all subaccounts.' })
  @ApiResponse({ status: 403, description: 'Forbidden (Insufficient role).' })
  async findAll(
    @Query() query: QuerySubaccountsDto,
  ) {
    // Calls the new findAll method in the service
    return this.subaccountService.findAll(query);
  }
  
  // --------------------------------------------------
  // 4. GET SUBACCOUNT BY USER ID (GET /subaccounts/user/:userId)
  // --------------------------------------------------
  @Get('user/:userId')
  @Roles(Role.ADMIN, Role.SUPERADMIN) // Only high-privilege roles can view others' subaccounts
  @ApiOperation({ summary: 'Retrieve any subaccount by a user ID (Admin only)' })
  @ApiParam({ name: 'userId', description: 'The ID of the user whose subaccount is requested' })
  @ApiResponse({ status: 200, description: 'Subaccount details retrieved.' })
  @ApiResponse({ status: 404, description: 'Subaccount not found.' })
  async getSubaccountByUserId(
    @Param('userId') userId: string,
  ) {
    // This reuses the getSubaccount service method
    return this.subaccountService.getSubaccount(userId);
  }
}