import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { JwtAuthGuard } from '../auth/guard/jwt.guard';
import { RolesGuard } from '../common/guard/roles.guards';
import { TenantGuard } from '../common/guard/tenant.guard';
import { Roles } from '../common/decorators/roles.decorators';
import { Role } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { OrganizationResponseDto } from './dto/organization-response.dto';

@ApiTags('Organizations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
@UseInterceptors(ClassSerializerInterceptor)
@Controller('orgs')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new organization' })
  @ApiResponse({ status: 201, description: 'Organization created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async createOrganization(@Body() dto: CreateOrganizationDto, @Req() req) {
    const ownerId = req.user.id;
    const organization = await this.organizationsService.createOrganization(ownerId, dto);
    return plainToInstance(OrganizationResponseDto, organization, {
      excludeExtraneousValues: true,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get organization by ID' })
  @ApiResponse({ status: 200, description: 'Organization retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getOrganization(@Param('id') id: string, @Req() req) {
    const userId = req.user.id;
    const userRole = req.user.role;
    const organization = await this.organizationsService.getOrganization(id, userId, userRole);
    return plainToInstance(OrganizationResponseDto, organization, {
      excludeExtraneousValues: true,
    });
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update organization' })
  @ApiResponse({ status: 200, description: 'Organization updated successfully' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async updateOrganization(
    @Param('id') id: string,
    @Body() dto: UpdateOrganizationDto,
    @Req() req,
  ) {
    const userId = req.user.id;
    const userRole = req.user.role;
    const organization = await this.organizationsService.updateOrganization(
      id,
      dto,
      userId,
      userRole,
    );
    return plainToInstance(OrganizationResponseDto, organization, {
      excludeExtraneousValues: true,
    });
  }

  @Get(':id/vehicles')
  @ApiOperation({ summary: 'Get all vehicles for an organization' })
  @ApiResponse({ status: 200, description: 'Vehicles retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getOrgVehicles(@Param('id') id: string, @Req() req) {
    const userId = req.user.id;
    const userRole = req.user.role;
    return this.organizationsService.getOrgVehicles(id, userId, userRole);
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'Get all members of an organization' })
  @ApiResponse({ status: 200, description: 'Members retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getOrgMembers(@Param('id') id: string, @Req() req) {
    const userId = req.user.id;
    const userRole = req.user.role;
    return this.organizationsService.getOrgMembers(id, userId, userRole);
  }

  @Post(':id/members')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a member to the organization' })
  @ApiResponse({ status: 201, description: 'Member added successfully' })
  @ApiResponse({ status: 400, description: 'Bad request (user already a member)' })
  @ApiResponse({ status: 404, description: 'Organization or user not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async addMember(@Param('id') id: string, @Body() dto: AddMemberDto, @Req() req) {
    const userId = req.user.id;
    const userRole = req.user.role;
    return this.organizationsService.addMember(id, dto, userId, userRole);
  }

  @Delete(':id/members/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a member from the organization' })
  @ApiResponse({ status: 204, description: 'Member removed successfully' })
  @ApiResponse({ status: 400, description: 'Bad request (cannot remove owner)' })
  @ApiResponse({ status: 404, description: 'Organization or member not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async removeMember(@Param('id') id: string, @Param('userId') memberUserId: string, @Req() req) {
    const userId = req.user.id;
    const userRole = req.user.role;
    return this.organizationsService.removeMember(id, memberUserId, userId, userRole);
  }
}
