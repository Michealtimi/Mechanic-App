import { Module } from '@nestjs/common';
import { MechanicController } from './mechanic.controller';
import { MechanicService } from './mechanic.service';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [UsersModule], // ✅ this now wo
  controllers: [MechanicController],
  providers: [MechanicService]
})
export class MechanicModule {}
