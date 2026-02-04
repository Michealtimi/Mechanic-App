import { Module } from '@nestjs/common';
import { ReceiptImageService } from './receipt-image.service';

@Module({
  providers: [ReceiptImageService],
  exports: [ReceiptImageService],
})
export class ReceiptModule {}
