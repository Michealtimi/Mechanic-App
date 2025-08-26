/* eslint-disable prettier/prettier */
 
// dto/booking-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { BookingStatus } from './creating-booking.dto';

export class BookingResponseDto {
  @Expose()
  @ApiProperty({ example: 'uuid-booking' })
  id: string;

  @Expose()
  @ApiProperty({ example: 'uuid-mechanic' })
  mechanicId: string;

  @Expose()
  @ApiProperty({ example: 'uuid-service' })
  serviceId: string;

  @Expose()
  @ApiProperty({
    example: new Date().toISOString(),
    description: 'Scheduled date/time',
  })
  scheduledAt: Date;

  @Expose()
  @ApiProperty({ enum: BookingStatus })
  status: BookingStatus;

  @Expose()
  @ApiProperty({ example: 'uuid-customer' })
  customerId: string;
}
