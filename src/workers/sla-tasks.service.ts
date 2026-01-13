/* eslint-disable prettier/prettier */
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SlaService } from './sla.service';

@Injectable()
export class SlaTasksService {
  private readonly logger = new Logger(SlaTasksService.name);

  constructor(private readonly slaService: SlaService) {}

  /**
   * 🕒 SLA BREACH MONITOR
   * This runs every minute (top of the minute).
   * It scans the database for mechanics who haven't arrived by their ETA.
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async handleSlaMonitoring() {
    this.logger.debug('Running background SLA breach check...');

    try {
      await this.slaService.checkAndAlertBreaches();
    } catch (error) {
      this.logger.error(
        `Critical failure in SLA background task: ${error.message}`,
        error.stack,
      );
    }
  }
}