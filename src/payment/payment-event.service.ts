import { Injectable, Logger } from '@nestjs/common';
import { PaymentEventRepository } from './payment-event.repository';
import { PaymentEventType } from '@prisma/client';

/**
 * Data Transfer Object for recording an event
 */
export interface RecordPaymentEventDto {
  paymentId: string;
  gateway: string;
  gatewayEvent: string;
  type: PaymentEventType;
  rawPayload: any;
}

@Injectable()
export class PaymentEventService {
  private readonly logger = new Logger(PaymentEventService.name);

  constructor(private readonly repo: PaymentEventRepository) {}

  /**
   * Attempts to record a payment event.
   * If the event (by gateway + gatewayEvent) already exists, 
   * the repository handles the 'ignore' logic via upsert.
   */
  async recordOrIgnore(dto: RecordPaymentEventDto) {
    try {
      this.logger.debug(
        `Processing ${dto.type} event for Payment ID: ${dto.paymentId} from ${dto.gateway}`
      );
      
      return await this.repo.recordOnce(dto);
    } catch (error) {
      // We log here but we don't want history-logging to crash the main payment flow
      // if it's a non-critical database hiccup.
      this.logger.error(`Audit Log Error: ${error.message}`, error.stack);
      this.logger.warn(
        'Payment event audit write failed; event not persisted. Consider alerting/monitoring.',
        { paymentId: dto.paymentId, gateway: dto.gateway, gatewayEvent: dto.gatewayEvent },
      );
      return null;
    }
  }
}