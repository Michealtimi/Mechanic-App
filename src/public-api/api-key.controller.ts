import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ApiKeyService } from './api-key.service';
import { JwtAuthGuard } from '../auth/guard/jwt.guard';
import { CreateApiKeyDto, ApiKeyResponseDto, RevokeApiKeyDto } from './dto/api-key.dto';
import { TenantId } from '../common/decorators/tenant-id.decorator';

@ApiTags('API Keys')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api-keys')
export class ApiKeyController {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new API key' })
  @ApiResponse({ status: 201, description: 'API key created', type: ApiKeyResponseDto })
  async createApiKey(
    @Body() dto: CreateApiKeyDto,
    @Req() req,
    @TenantId() tenantId: string,
  ): Promise<ApiKeyResponseDto> {
    return await this.apiKeyService.createApiKey(dto, req.user.id, tenantId);
  }

  @Get()
  @ApiOperation({ summary: 'List all API keys for current user/organization' })
  @ApiResponse({ status: 200, description: 'API keys listed', type: [ApiKeyResponseDto] })
  async listApiKeys(@Req() req, @TenantId() tenantId?: string): Promise<ApiKeyResponseDto[]> {
    return await this.apiKeyService.listApiKeys(req.user.id, tenantId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke an API key' })
  @ApiResponse({ status: 204, description: 'API key revoked' })
  async revokeApiKey(
    @Param('id') id: string,
    @Body() dto: RevokeApiKeyDto,
    @Req() req,
  ): Promise<void> {
    await this.apiKeyService.revokeApiKey(id, req.user.id, dto);
  }
}
