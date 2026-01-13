// src/dispute/dto/dispute.dto.ts (Create this new file)

import {
  IsString,
  IsUUID,
  IsNumber,
  Min,
  IsBoolean,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RaiseDisputeDto {
  @ApiProperty({ description: 'The ID of the booking related to the dispute', example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef' })
  @IsUUID()
  @IsNotEmpty()
  bookingId: string;

  @ApiProperty({ description: 'The reason for raising the dispute', example: 'Mechanic did not complete the agreed-upon service.' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class ResolveDisputeDto {
  @ApiProperty({ description: 'The admin-provided resolution statement for the dispute', example: 'Partial refund issued to customer due to incomplete service.' })
  @IsString()
  @IsNotEmpty()
  resolution: string;

  @ApiProperty({ description: 'The amount to be refunded/adjusted as part of the resolution', example: 50.75 })
  @IsNumber()
  @Min(0) // Refund amount cannot be negative
  @IsNotEmpty()
  refundAmount: number; // Keep as number for DTO, service converts to Decimal

  @ApiProperty({ description: 'Indicates if a refund should be processed to the customer via payment gateway', example: true })
  @IsBoolean()
  isRefundToCustomer: boolean;

  @ApiProperty({ description: 'Indicates if the mechanic\'s internal wallet should be debited as part of the resolution', example: true })
  @IsBoolean()
  isDebitMechanic: boolean;
}

// You might also want a response DTO for disputes:
import { DisputeStatus, Role } from '@prisma/client';
import { Expose, Type } from 'class-transformer';

export class UserDisputeResponseDto {
    @Expose()
    @ApiProperty()
    id: string;

    @Expose()
    @ApiProperty()
    firstName: string;

    @Expose()
    @ApiProperty()
    lastName: string;

    @Expose()
    @ApiProperty({ enum: Role })
    role: Role;
}

export class BookingDisputeResponseDto {
    @Expose()
    @ApiProperty()
    id: string;

    @Expose()
    @ApiProperty()
    customerId: string;

    @Expose()
    @ApiProperty()
    mechanicId: string;

    @Expose()
    @ApiProperty()
    serviceId: string; // Assuming booking has a serviceId

    @Expose()
    @ApiProperty({ type: 'number' })
    totalCost: number; // Assuming totalCost is a number or convert to it
}

export class DisputeResponseDto {
    @Expose()
    @ApiProperty({ example: 'uuid-dispute-id' })
    id: string;

    @Expose()
    @ApiProperty({ example: 'uuid-user-id' })
    userId: string;

    @Expose()
    @ApiProperty({ example: 'uuid-booking-id' })
    bookingId: string;

    @Expose()
    @ApiProperty({ example: 'Service was not completed properly.' })
    reason: string;

    @Expose()
    @ApiProperty({ example: 'Partial refund issued.', required: false })
    resolution?: string;

    @Expose()
    @ApiProperty({ enum: DisputeStatus, example: DisputeStatus.PENDING })
    status: DisputeStatus;

    @Expose()
    @ApiProperty({ type: 'number', example: 50.00, required: false })
    resolvedAmount?: number; // Represent as number for JSON output

    @Expose()
    @ApiProperty({ example: new Date().toISOString() })
    @Type(() => Date)
    createdAt: Date;

    @Expose()
    @ApiProperty({ example: new Date().toISOString() })
    @Type(() => Date)
    updatedAt: Date;

    @Expose()
    @Type(() => UserDisputeResponseDto)
    @ApiProperty({ type: UserDisputeResponseDto, required: false })
    user?: UserDisputeResponseDto;

    @Expose()
    @Type(() => BookingDisputeResponseDto)
    @ApiProperty({ type: BookingDisputeResponseDto, required: false })
    booking?: BookingDisputeResponseDto;
}