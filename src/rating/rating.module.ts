/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { RatingService } from './rating.service';
import { RatingController } from './rating.controller';
import { PrismaService } from 'prisma/prisma.service'; // Needed for RatingService dependency

@Module({
  providers: [
    RatingService, 
    PrismaService, 
  ],
  controllers: [RatingController],
 
  exports: [RatingService], 
})
export class RatingModule {}