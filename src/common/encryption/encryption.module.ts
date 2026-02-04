import { Module, Global } from '@nestjs/common';
import { EncryptionService } from './encryption.service';

/**
 * EncryptionModule
 * 
 * Global module providing encryption services for sensitive data.
 * Import this module in AppModule to make EncryptionService available
 * throughout the application.
 */
@Global()
@Module({
  providers: [EncryptionService],
  exports: [EncryptionService],
})
export class EncryptionModule {}
