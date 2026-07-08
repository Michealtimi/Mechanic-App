import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateApiKeyDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ default: 60 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10000)
  rateLimitPerMinute?: number;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedIps?: string[];

  @ApiPropertyOptional({ type: [String], default: ['read', 'write'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  scopes?: string[];
}

export class RevokeApiKeyDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}

export class ApiKeyResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  key: string;

  @ApiProperty()
  keyPrefix: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  rateLimitPerMinute: number;

  @ApiProperty({ type: [String] })
  allowedIps: string[];

  @ApiProperty({ type: [String] })
  scopes: string[];

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional()
  lastUsedAt?: Date;
}
