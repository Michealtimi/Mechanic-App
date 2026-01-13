// src/audit/audit.controller.ts
import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  Logger,
  Res,
  HttpCode,
  HttpStatus,
  ParseEnumPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { QueryAuditDto } from './dto/query-audit.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Adjust path
import { RolesGuard } from '../auth/guards/roles.guard'; // Adjust path
import { HasRoles } from '../auth/decorators/roles.decorator'; // Adjust path
import { Role } from '@prisma/client'; // Import Prisma Role enum
import { Response } from 'express'; // For @Res() type hinting

enum ExportFormat {
  JSON = 'json',
  CSV = 'csv',
}

@ApiTags('Audit Logs')
@ApiBearerAuth() // Indicates that JWT token is required
@UseGuards(JwtAuthGuard, RolesGuard) // Apply guards at controller level
@HasRoles(Role.ADMIN, Role.SUPERADMIN) // Only Admins and SuperAdmins can access audit logs
@Controller('audit-logs')
export class AuditController {
  private readonly logger = new Logger(AuditController.name);

  constructor(private readonly auditService: AuditService) {}

  @Get()
  @ApiResponse({ status: 200, description: 'Retrieve a list of audit logs' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'actor', required: false, type: String })
  @ApiQuery({ name: 'entity', required: false, type: String })
  @ApiQuery({ name: 'action', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String, format: 'date-time' })
  @ApiQuery({ name: 'endDate', required: false, type: String, format: 'date-time' })
  async findAll(@Query() queryDto: QueryAuditDto) {
    this.logger.debug(`Fetching all audit logs with query: ${JSON.stringify(queryDto)}`);
    return this.auditService.findAll(queryDto);
  }

  @Get('entity/:entity/:entityId')
  @ApiResponse({ status: 200, description: 'Retrieve audit logs for a specific entity' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async findByEntity(
    @Param('entity') entity: string,
    @Param('entityId') entityId: string,
  ) {
    this.logger.debug(`Fetching audit logs for entity: ${entity}, ID: ${entityId}`);
    return this.auditService.findByEntity(entity, entityId);
  }

  @Get('statistics')
  @ApiResponse({ status: 200, description: 'Retrieve audit log statistics' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiQuery({ name: 'startDate', required: false, type: String, format: 'date-time' })
  @ApiQuery({ name: 'endDate', required: false, type: String, format: 'date-time' })
  async getStatistics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    this.logger.debug(`Fetching audit log statistics from ${startDate} to ${endDate}`);
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.auditService.getStatistics(start, end);
  }

  @Get('export')
  @HttpCode(HttpStatus.OK)
  @ApiResponse({ status: 200, description: 'Export audit logs', content: {
    'application/json': { schema: { type: 'object' } },
    'text/csv': { schema: { type: 'string', format: 'binary' } }
  }})
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiQuery({ name: 'format', enum: ExportFormat, required: false, description: 'Output format (json or csv)', default: ExportFormat.JSON })
  @ApiQuery({ name: 'actor', required: false, type: String })
  @ApiQuery({ name: 'entity', required: false, type: String })
  @ApiQuery({ name: 'action', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String, format: 'date-time' })
  @ApiQuery({ name: 'endDate', required: false, type: String, format: 'date-time' })
  async exportAuditLogs(
    @Query() queryDto: QueryAuditDto,
    @Query('format', new ParseEnumPipe(ExportFormat, { optional: true })) format: ExportFormat = ExportFormat.JSON,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.logger.debug(`Exporting audit logs in ${format} format with query: ${JSON.stringify(queryDto)}`);
    const exportData = await this.auditService.export(queryDto, format);

    if (format === ExportFormat.CSV) {
      res.set({
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="audit_logs_${new Date().toISOString()}.csv"`,
      });
      return exportData; // exportData is already a string for CSV
    }

    res.set({
      'Content-Type': 'application/json',
      'Content-Disposition': `inline; filename="audit_logs_${new Date().toISOString()}.json"`,
    });
    return exportData;
  }

  @Get(':id')
  @ApiResponse({ status: 200, description: 'Retrieve a single audit log by ID' })
  @ApiResponse({ status: 404, description: 'Audit log not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async findOne(@Param('id') id: string) {
    this.logger.debug(`Fetching audit log with ID: ${id}`);
    return this.auditService.findOne(id);
  }
}