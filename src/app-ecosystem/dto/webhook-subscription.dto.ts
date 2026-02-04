import { IsString, IsUrl, IsArray, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum WebhookEvent {
  BOOKING_CREATED = 'BOOKING_CREATED',
  BOOKING_COMPLETED = 'BOOKING_COMPLETED',
  BOOKING_CANCELLED = 'BOOKING_CANCELLED',
  PAYMENT_SUCCESS = 'PAYMENT_SUCCESS',
  DISPUTE_CREATED = 'DISPUTE_CREATED',
  MECHANIC_ASSIGNED = 'MECHANIC_ASSIGNED',
}

export class CreateWebhookSubscriptionDto {
  @ApiProperty({ description: 'Webhook URL', example: 'https://example.com/webhook' })
  @IsUrl()
  url: string;

  @ApiProperty({ description: 'Events to subscribe to', enum: WebhookEvent, isArray: true })
  @IsArray()
  @IsEnum(WebhookEvent, { each: true })
  events: WebhookEvent[];

  @ApiPropertyOptional({ description: 'Secret for webhook signature verification' })
  @IsOptional()
  @IsString()
  secret?: string;
}

export class WebhookSubscriptionResponseDto {
  @ApiProperty({ description: 'Subscription ID' })
  id: string;

  @ApiProperty({ description: 'Webhook URL' })
  url: string;

  @ApiProperty({ description: 'Subscribed events', enum: WebhookEvent, isArray: true })
  events: WebhookEvent[];

  @ApiProperty({ description: 'Is active' })
  isActive: boolean;

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;
}
