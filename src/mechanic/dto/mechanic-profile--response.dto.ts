/* eslint-disable prettier/prettier */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MechanicProfileResponseDto {
  @ApiProperty({ example: 'uuid-of-mechanic', description: 'Unique identifier for the mechanic' })
  id: string;

  @ApiProperty({ example: 'mechanic@example.com', description: 'Email of the mechanic' })
  email: string;

  @ApiPropertyOptional({ example: 'Joe’s Auto Shop', description: 'Name of the mechanic’s shop' })
  shopName?: string | null;

  @ApiPropertyOptional({ example: 'Lagos, Nigeria', description: 'Location of the mechanic' })
  location?: string | null;

  @ApiPropertyOptional({ example: ['Engine repair', 'Oil change'], description: 'Skills or specialties' })
  skills?: string[] | null;

  @ApiPropertyOptional({ example: 'https://example.com/profile.jpg', description: 'Profile picture URL' })
  profilePictureUrl?: string | null;

  @ApiPropertyOptional({ example: 'Certified Toyota technician', description: 'Short bio' })
  bio?: string | null;

  @ApiPropertyOptional({ example: 5, description: 'Years of experience' })
  experienceYears?: number | null;

  @ApiPropertyOptional({
    example: ['https://example.com/cert1.pdf', 'https://example.com/cert2.pdf'],
    description: 'URLs of uploaded certifications',
  })
  certificationUrls?: string[] | null;

  @ApiProperty({ example: '2024-01-01T00:00:00Z', description: 'Profile creation date' })
  createdAt: Date;

  @ApiProperty({ example: '2024-06-01T00:00:00Z', description: 'Last updated date' })
  updatedAt: Date;
}
