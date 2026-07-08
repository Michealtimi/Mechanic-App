// Consolidated user DTOs for controller and auth
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { Role, Status, OrgRole } from '@prisma/client';
import { IsOptional, IsEnum, IsInt, Min, Max, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export { CreateUserDto, UpdateUserDto, SignupCustomerDto } from './create-user.dto';
export { SignupMechanicDto } from './createmechanic.dto';

/** User response for auth and profile (exclude password) */
export class UserResponseDto {
  @Expose()
  @ApiProperty()
  id: string;

  @Expose()
  @ApiProperty()
  email: string;

  @Expose()
  @ApiPropertyOptional()
  firstName?: string | null;

  @Expose()
  @ApiPropertyOptional()
  lastName?: string | null;

  @Expose()
  @ApiPropertyOptional()
  phoneNumber?: string | null;

  @Expose()
  @ApiProperty({ enum: Role })
  role: Role;

  @Expose()
  @ApiPropertyOptional({ enum: OrgRole, description: 'User\'s role in primary org (for fleet/dispatcher routing)' })
  orgRole?: OrgRole | null;

  @Expose()
  @ApiPropertyOptional({ description: 'Effective role for UI routing (e.g. FLEET_MANAGER when ADMIN + orgRole FLEET_MANAGER)' })
  effectiveRole?: string | null;

  @Expose()
  @ApiPropertyOptional({ enum: Status })
  status?: Status;

  @Expose()
  @ApiPropertyOptional()
  tenantId?: string | null;

  @Expose()
  @ApiProperty()
  createdAt: Date;

  @Expose()
  @ApiProperty()
  updatedAt: Date;

  @Expose()
  @ApiPropertyOptional()
  lastLogin?: Date | null;

  @Expose()
  @ApiPropertyOptional()
  shopName?: string | null;

  @Expose()
  @ApiPropertyOptional()
  currentLat?: number | null;

  @Expose()
  @ApiPropertyOptional()
  currentLng?: number | null;

  @Expose()
  @ApiPropertyOptional()
  isAvailableForJobs?: boolean;

  @Expose()
  @ApiPropertyOptional()
  isEvSpecialist?: boolean;

  @Expose()
  @ApiPropertyOptional()
  serviceRadiusKm?: number;

  @Expose()
  @ApiPropertyOptional()
  profilePictureUrl?: string | null;

  @Expose()
  @ApiPropertyOptional()
  bio?: string | null;

  @Expose()
  @ApiPropertyOptional()
  averageRating?: number;

  @Expose()
  @ApiPropertyOptional()
  totalReviews?: number;

  @Expose()
  @ApiPropertyOptional()
  totalJobsCompleted?: number;

  @Expose()
  @ApiPropertyOptional()
  experienceYears?: number | null;

  @Expose()
  @ApiPropertyOptional()
  certificationUrls?: string[];

  @Expose()
  @ApiPropertyOptional()
  skills?: { id: string; name: string }[];
}

/** Mechanic-specific response (same shape as user; kept for API clarity) */
export class MechanicResponseDto extends UserResponseDto {}

/** Query filter for listing users */
export class UserFilterDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsEnum(Status)
  status?: Status;

  @IsOptional()
  isEvSpecialist?: boolean;

  @IsOptional()
  isAvailableForJobs?: boolean;

  @IsOptional()
  @Type(() => Number)
  minRating?: number;
}
