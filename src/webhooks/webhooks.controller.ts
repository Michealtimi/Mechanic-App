import {
  Controller,
  Post,
  Body,
  Headers,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader, ApiBody, ApiParam } from '@nestjs/swagger';
import { WebhooksService } from './webhooks.service';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('telemetry/:provider')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Receive telemetry webhook from external provider' })
  @ApiHeader({ name: 'X-Webhook-Signature', required: false, description: 'Webhook signature for verification' })
  @ApiParam({ name: 'provider', description: 'Provider name (SMARTCAR, TOR_LOCO, etc.)' })
  @ApiBody({ description: 'Webhook payload' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  async receiveTelemetryWebhook(
    @Param('provider') provider: string,
    @Body() payload: any,
    @Headers('x-webhook-signature') signature?: string,
  ) {
    return await this.webhooksService.processTelemetryWebhook(provider, payload, signature);
  }

  @Post('payment/:provider')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Receive payment webhook from external provider' })
  @ApiHeader({ name: 'X-Webhook-Signature', required: false })
  @ApiParam({ name: 'provider', description: 'Payment provider (PAYSTACK, FLUTTERWAVE, etc.)' })
  @ApiBody({ description: 'Webhook payload' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  async receivePaymentWebhook(
    @Param('provider') provider: string,
    @Body() payload: any,
    @Headers('x-webhook-signature') signature?: string,
  ) {
    return await this.webhooksService.processPaymentWebhook(provider, payload, signature);
  }

  @Post('vehicle/:provider')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Receive vehicle status webhook from external provider' })
  @ApiHeader({ name: 'X-Webhook-Signature', required: false })
  @ApiParam({ name: 'provider', description: 'Provider name' })
  @ApiBody({ description: 'Webhook payload' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  async receiveVehicleWebhook(
    @Param('provider') provider: string,
    @Body() payload: any,
    @Headers('x-webhook-signature') signature?: string,
  ) {
    return await this.webhooksService.processVehicleWebhook(provider, payload, signature);
  }
}
