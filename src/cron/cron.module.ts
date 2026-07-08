import { Module } from '@nestjs/common';
import { BookingCleanupService } from './booking-cleanup.service';
import { PaymentReconcileService } from './payment-reconcile.service';
import { SlaTasksService } from '../workers/sla-tasks.service';
import { PaymentModule } from 'src/payment/payments.module';
import { NotificationModule } from 'src/notification/notification.module';
import { SlaModule } from 'src/sla/sla.module';

@Module({
  imports: [PaymentModule, NotificationModule, SlaModule],
  providers: [BookingCleanupService, PaymentReconcileService, SlaTasksService],
})
export class CronModule {}
