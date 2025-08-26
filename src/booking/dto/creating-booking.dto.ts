/* eslint-disable prettier/prettier */
// dto/create-booking.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsDateString, IsEnum, IsOptional } from 'class-validator';


// dto/booking-status.enum.ts
export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}


export class CreateBookingDto {
  @ApiProperty({ example: 'uuid-mechanic', description: 'Mechanic ID' })
  @IsUUID()
  mechanicId: string;

  @ApiProperty({ example: 'uuid-service', description: 'Service ID' })
  @IsUUID()
  serviceId: string;

  @ApiProperty({
    example: new Date().toISOString(),
    description: 'Scheduled date/time of the service',
  })
  @IsDateString()
  scheduledAt: Date;

  @ApiProperty({
    example: BookingStatus.PENDING,
    enum: BookingStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;
}
