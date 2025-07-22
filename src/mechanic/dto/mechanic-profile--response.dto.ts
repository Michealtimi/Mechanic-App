import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MechanicProfileResponseDto {
  @ApiProperty({ example: '9f2131a3-4b2f-4129-82ab-1e781b3b7ef0', description: 'Unique identifier for the mechanic' })
  id: string;

  @ApiProperty({ example: 'mechanic@example.com', description: 'Email address of the mechanic' })
  email: string;

  @ApiPropertyOptional({ example: 'Joe’s Auto Shop', description: 'Name of the mechanic’s shop' })
  shopName?: string | null;

  @ApiPropertyOptional({ example: 'Lagos, Nigeria', description: 'Location of the mechanic' })
  location?: string | null;

  @ApiPropertyOptional({ example: 'Engine repair, oil change', description: 'Skills or specialties of the mechanic' })
  skills?: string | null;

  @ApiPropertyOptional({ example: 'https://example.com/profile.jpg', description: 'URL to profile picture' })
  profilePictureUrl?: string | null;

  @ApiPropertyOptional({ example: 'Certified Toyota technician', description: 'Short biography or background' })
  bio?: string | null;

  @ApiPropertyOptional({ example: 5, description: 'Years of experience' })
  experienceYears?: number | null;

  @ApiPropertyOptional({ example: ['https://example.com/cert1.pdf', 'https://example.com/cert2.pdf'], description: 'URLs of uploaded certifications' })
  certificationUrls?: string[] | null;

  @ApiProperty({ example: '2024-01-01T00:00:00Z', description: 'Profile creation date' })
  createdAt: Date;

  @ApiProperty({ example: '2024-06-01T00:00:00Z', description: 'Profile last updated date' })
  updatedAt: Date;
}
