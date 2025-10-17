// dto/create-payment.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsInt, Min } from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty({ example: 'uuid-of-booking' })
  @IsUUID()
  bookingId: string;

  @ApiProperty({ example: 5000 })
  @IsInt()
  @Min(100) // Minimum NGN 100
  amount: number;
}


export class PaymentResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;

  @ApiProperty({ nullable: true })
  data?: any;
}