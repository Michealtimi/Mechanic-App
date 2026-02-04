import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DispatchService } from './dispatch.service';

/**
 * Invisible Foreman: Run dispatch offer timeout every minute.
 * Cancels expired offers and creates 5 new offers for bookings still PENDING.
 */
@Injectable()
export class DispatchTimeoutCron {
  private readonly logger = new Logger(DispatchTimeoutCron.name);

  constructor(private readonly dispatchService: DispatchService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleTimeoutRound() {
    try {
      const { processed, newOffers } = await this.dispatchService.runOfferTimeoutRound();
      if (processed > 0 || newOffers > 0) {
        this.logger.log(`Dispatch timeout round: ${processed} bookings processed, ${newOffers} new offers created`);
      }
    } catch (err: any) {
      this.logger.error(`Dispatch timeout round failed: ${err?.message}`, err?.stack);
    }
  }
}
