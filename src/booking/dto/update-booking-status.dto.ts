/* eslint-disable prettier/prettier */
// dto/update-booking-status.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { BookingStatus } from './creating-booking.dto';


export class UpdateBookingStatusDto {
  @ApiProperty({ example: BookingStatus.CONFIRMED, enum: BookingStatus })
  @IsEnum(BookingStatus)
  status: BookingStatus;
}
