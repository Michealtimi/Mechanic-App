import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { Prisma, PaymentEventType } from '@prisma/client';

@Injectable()
export class PaymentEventRepository {
  private readonly logger = new Logger(PaymentEventRepository.name);

  constructor(private prisma: PrismaService) {}

  /**
   * recordOnce ensures we log a gateway event exactly one time.
   * If the event (gateway + gatewayEvent) already exists, it returns the existing record.
   * If it doesn't exist, it creates it.
   */
  async recordOnce(input: {
    paymentId: string;
    gateway: string;
    gatewayEvent: string;
    type: PaymentEventType;
    rawPayload: any;
  }) {
    try {
      return await this.prisma.paymentEvent.upsert({
        where: {
          gateway_gatewayEvent: {
            gateway: input.gateway,
            gatewayEvent: input.gatewayEvent,
          },
        },
        update: {}, // IDEMPOTENCY: Do not change existing data
        create: {
          paymentId: input.paymentId,
          gateway: input.gateway,
          gatewayEvent: input.gatewayEvent,
          type: input.type,
          rawPayload: input.rawPayload as Prisma.InputJsonValue,
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to upsert PaymentEvent for Payment ${input.paymentId}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Database error while recording payment event');
    }
  }
}
