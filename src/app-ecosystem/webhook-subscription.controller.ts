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
import { WebhookSubscriptionService } from './webhook-subscription.service';
import { JwtAuthGuard } from '../auth/guard/jwt.guard';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import {
  CreateWebhookSubscriptionDto,
  WebhookSubscriptionResponseDto,
} from './dto/webhook-subscription.dto';

@ApiTags('Webhook Subscriptions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('webhook-subscriptions')
export class WebhookSubscriptionController {
  constructor(private readonly webhookSubscriptionService: WebhookSubscriptionService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create webhook subscription' })
  @ApiResponse({ status: 201, description: 'Webhook subscription created', type: WebhookSubscriptionResponseDto })
  async create(
    @Body() dto: CreateWebhookSubscriptionDto,
    @Req() req,
    @TenantId() tenantId?: string,
  ): Promise<WebhookSubscriptionResponseDto> {
    return await this.webhookSubscriptionService.createSubscription(dto, req.user.id, tenantId);
  }

  @Get()
  @ApiOperation({ summary: 'List webhook subscriptions' })
  @ApiResponse({ status: 200, description: 'Webhook subscriptions listed', type: [WebhookSubscriptionResponseDto] })
  async list(@Req() req, @TenantId() tenantId?: string): Promise<WebhookSubscriptionResponseDto[]> {
    return await this.webhookSubscriptionService.listSubscriptions(req.user.id, tenantId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete webhook subscription' })
  @ApiResponse({ status: 204, description: 'Webhook subscription deleted' })
  async delete(@Param('id') id: string, @Req() req): Promise<void> {
    await this.webhookSubscriptionService.deleteSubscription(id, req.user.id);
  }
}
