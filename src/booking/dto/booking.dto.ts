/* eslint-disable prettier/prettier */

import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsUUID,
  IsDateString,
  IsEnum,
  IsOptional,
  IsInt,
  Min,
  IsString,
  IsBoolean,
  IsNumber,
  IsNotEmpty,
} from 'class-validator';
import { Type, Expose } from 'class-transformer';
import { BookingStatus, PaymentStatus, Role } from '@prisma/client'; // Import enums from Prisma

// --- 1. Request DTOs ---

/**
 * DTO for creating a new booking.
 * Customer initiates this to book a mechanic service.
 */
 export class CreateBookingDto {
  @ApiProperty({ example: 'uuid-mechanic', description: 'ID of the mechanic to book', required: false })
  @IsOptional() // Made optional for future auto-assignment
  @IsUUID()
  mechanicId?: string; // Made optional

  @ApiProperty({ example: 'uuid-service', description: 'ID of the service being booked' })
  @IsUUID()
  @IsNotEmpty()
  serviceId: string;

  @ApiProperty({
    example: new Date().toISOString(),
    description: 'Scheduled date and time of the service (ISO 8601 format)',
  })
  @IsDateString()
  @IsNotEmpty()
  scheduledAt: Date; // Keep as Date if the frontend sends it as a Date object or ISO string that can be directly cast

  // Status is typically set by the service (to PENDING) so it's optional here.
  @ApiProperty({
    example: BookingStatus.PENDING,
    enum: BookingStatus,
    required: false,
    description: 'Initial status of the booking (defaults to PENDING)',
  })
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus = BookingStatus.PENDING; // Add a default for safety

  // --- NEW FIELDS FOR PICKUP LOCATION ---
  @ApiProperty({
    example: '34.0522',
    description: 'Latitude of the customer\'s pickup location. Must be a decimal string.',
    type: String, // Expect as string from frontend for Decimal conversion
  })
  @IsString()
  @IsNotEmpty()
  pickupLatitude: string; // Will be converted to Prisma.Decimal in service

  @ApiProperty({
    example: '-118.2437',
    description: 'Longitude of the customer\'s pickup location. Must be a decimal string.',
    type: String, // Expect as string from frontend for Decimal conversion
  })
  @IsString()
  @IsNotEmpty()
  pickupLongitude: string; // Will be converted to Prisma.Decimal in service

  @ApiProperty({
    example: '123 Main St, Anytown, USA',
    description: 'Human-readable address of the customer\'s pickup location.',
  })
  @IsString()
  @IsNotEmpty()
  pickupAddress: string;

  @ApiProperty({
    example: 'Behind the red building with a large sign.',
    required: false,
    description: 'Optional additional notes for the mechanic regarding the pickup location.',
  })
  @IsOptional()
  @IsString()
  pickupLocationNotes?: string;
  // --- END NEW FIELDS ---
}


/**
 * DTO for updating the status of an existing booking.
 * Primarily used by mechanics.
 */
export class UpdateBookingStatusDto {
  @ApiProperty({ example: BookingStatus.CONFIRMED, enum: BookingStatus, description: 'New status for the booking' })
  @IsEnum(BookingStatus)
  status: BookingStatus;
}

/**
 * DTO for filtering a list of bookings.
 */
export class BookingFilterDto {
  @ApiProperty({ example: BookingStatus.PENDING, enum: BookingStatus, required: false, description: 'Filter bookings by status' })
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @ApiProperty({ example: 0, required: false, description: 'Number of items to skip for pagination' })
  @IsOptional()
  @Type(() => Number) // Ensure transformation from string to number for query params
  @IsInt()
  @Min(0)
  skip?: number = 0; // Default value

  @ApiProperty({ example: 10, required: false, description: 'Number of items to take for pagination' })
  @IsOptional()
  @Type(() => Number) // Ensure transformation from string to number for query params
  @IsInt()
  @Min(1)
  take?: number = 10; // Default value
}


// --- 2. Response DTOs (for nested objects) ---

/**
 * DTO for representing a User (Customer) within a booking response.
 */
export class UserInBookingResponseDto {
  @Expose()
  @ApiProperty({ example: 'uuid-user-id' })
  id: string;

  @Expose()
  @ApiProperty({ example: 'John' })
  firstName: string;

  @Expose()
  @ApiProperty({ example: 'Doe' })
  lastName: string;

  @Expose()
  @ApiProperty({ example: 'john.doe@example.com' })
  email: string;

  @Expose()
  @ApiProperty({ example: '+1234567890', required: false })
  @IsOptional()
  phoneNumber?: string;
}

/**
 * DTO for representing a Mechanic within a booking response,
 * extending UserInBookingResponseDto with mechanic-specific fields.
 */
export class MechanicInBookingResponseDto extends UserInBookingResponseDto {
  @Expose()
  @ApiProperty({ example: 'AutoFix Pro' })
  shopName: string;

  @Expose()
  @ApiProperty({ example: 4.5, description: 'Average rating of the mechanic' })
  @IsNumber()
  averageRating: number;

  @Expose()
  @ApiProperty({ example: 120, description: 'Total number of reviews for the mechanic' })
  @IsInt()
  totalReviews: number;

  @Expose()
  @ApiProperty({ example: true, description: 'Indicates if the mechanic specializes in EV' })
  @IsBoolean()
  isEvSpecialist: boolean;
}

/**
 * DTO for representing a MechanicService within a booking response.
 */
export class ServiceInBookingResponseDto {
  @Expose()
  @ApiProperty({ example: 'uuid-service-id' })
  id: string;

  @Expose()
  @ApiProperty({ example: 'Oil Change' })
  title: string; // Changed from 'name' to 'title' to match schema

  @Expose()
  @ApiProperty({ example: 'Full synthetic oil change and filter replacement.' })
  description: string;

  @Expose()
  @ApiProperty({ example: '50.00', description: 'Price of the service (as string for Decimal)' })
  @IsString() // Decimal values are often returned as strings from Prisma to avoid precision issues
  price: string;
}

/**
 * DTO for representing a ChatRoom within a booking response.
 */
export class ChatRoomInBookingResponseDto {
  @Expose()
  @ApiProperty({ example: 'uuid-chatroom-id' })
  id: string;
}

/**
 * DTO for representing a Payment within a booking response.
 */
export class PaymentInBookingResponseDto {
  @Expose()
  @ApiProperty({ example: 'uuid-payment-id' })
  id: string;

  @Expose()
  @ApiProperty({ enum: PaymentStatus, example: PaymentStatus.AUTHORIZED })
  status: PaymentStatus;

  @Expose()
  @ApiProperty({ example: '100.00', description: 'Amount of the payment (as string for Decimal)' })
  @IsString()
  amount: string;

  @Expose()
  @ApiProperty({ example: 'ps_ref_xyz123', description: 'Payment gateway reference' })
  reference: string;
}

/**
 * DTO for representing a Dispute within a booking response.
 * (Assuming a simple dispute DTO for now)
 */
export class DisputeInBookingResponseDto {
    @Expose()
    @ApiProperty({ example: 'uuid-dispute-id' })
    id: string;

    @Expose()
    @ApiProperty({ example: 'Mechanic did not complete the job.' })
    reason: string;

    @Expose()
    @ApiProperty({ example: 'OPEN' }) // Assuming a DisputeStatus enum
    status: string; // You might want to create a DisputeStatus enum for this

    @Expose()
    @ApiProperty({ example: new Date().toISOString() })
    createdAt: Date;
}


// --- 3. Main Response DTO ---

/**
 * DTO for the complete booking response, including all related entities.
 */
export class BookingResponseDto {
  @Expose()
  @ApiProperty({ example: 'uuid-booking-id' })
  id: string;

  @Expose()
  @ApiProperty({ example: 'uuid-customer-id' })
  customerId: string; // Redundant if `customer` is included, but often kept for direct access

  @Expose()
  @ApiProperty({ example: 'uuid-mechanic-id' })
  mechanicId: string; // Redundant if `mechanic` is included, but often kept for direct access

  @Expose()
  @Type(() => UserInBookingResponseDto)
  @ApiProperty({ type: UserInBookingResponseDto })
  customer: UserInBookingResponseDto;

  @Expose()
  @Type(() => MechanicInBookingResponseDto)
  @ApiProperty({ type: MechanicInBookingResponseDto })
  mechanic: MechanicInBookingResponseDto;

  @Expose()
  @Type(() => ServiceInBookingResponseDto)
  @ApiProperty({ type: ServiceInBookingResponseDto })
  service: ServiceInBookingResponseDto;

  @Expose()
  @ApiProperty({
    example: new Date().toISOString(),
    description: 'Scheduled date/time of the booking',
  })
  @Type(() => Date)
  scheduledAt: Date;

  @Expose()
  @ApiProperty({ example: '150.75', description: 'Total price of the booking (as string for Decimal)' })
  @IsString()
  price: string; // Decimal values are often returned as strings from Prisma

  @Expose()
  @ApiProperty({ enum: BookingStatus, example: BookingStatus.CONFIRMED })
  status: BookingStatus;

  @Expose()
  @ApiProperty({ example: new Date().toISOString(), description: 'Timestamp when the booking was created' })
  @Type(() => Date)
  createdAt: Date;

  @Expose()
  @ApiProperty({ example: new Date().toISOString(), description: 'Timestamp when the booking was last updated' })
  @Type(() => Date)
  updatedAt: Date;

  @Expose()
  @IsOptional()
  @Type(() => ChatRoomInBookingResponseDto)
  @ApiProperty({ type: ChatRoomInBookingResponseDto, required: false, description: 'Associated chat room details' })
  chatRoom?: ChatRoomInBookingResponseDto; // Now included

  @Expose()
  @IsOptional()
  @Type(() => PaymentInBookingResponseDto)
  @ApiProperty({ type: PaymentInBookingResponseDto, required: false, description: 'Associated payment details' })
  payment?: PaymentInBookingResponseDto; // Now included

  @Expose()
  @IsOptional()
  @Type(() => DisputeInBookingResponseDto)
  @ApiProperty({ type: [DisputeInBookingResponseDto], required: false, description: 'List of disputes related to this booking' })
  disputes?: DisputeInBookingResponseDto[]; // Now included in `getBookingById`
}
