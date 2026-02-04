import { Global, Module } from '@nestjs/common';
import { MailService } from '../utils/mail.service';

@Global()
@Module({
  providers: [MailService],
  exports: [MailService],
})
export class SharedModule {}
