/* eslint-disable prettier/prettier */
import { IsString, IsUUID, IsOptional, IsUrl, IsNotEmpty, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for a Mechanic to upload proof of their Electric Vehicle (EV) servicing certification.
 */
export class UploadEvCertDto {
  
  @ApiProperty({ 
    description: 'The unique ID of the Mechanic uploading the certificate.', 
    example: 'm8e5c1b2-2f6g-4d9c-9b8f-2e3d4c5b6a7f' 
  })
  @IsUUID()
  @IsNotEmpty()
  mechanicId: string;

  @ApiProperty({ 
    description: 'The publicly accessible URL pointing to the EV certification document (image or PDF).', 
    example: 'https://storage.example.com/certificates/mechanic_ev_cert.pdf' 
  })
  @IsUrl({}, { message: 'certUrl must be a valid URL.' })
  @IsNotEmpty()
  @Length(5, 2048) // Enforce a reasonable length for a URL
  certUrl: string;

  @ApiPropertyOptional({ 
    description: 'Name of the certifying organization or training provider (e.g., Tesla, SAE, third-party school).', 
    example: 'SAE Hybrid/EV Specialist Certification' 
  })
  @IsOptional()
  @IsString()
  @Length(2, 255) // Optional, but enforce length if provided
  provider?: string;
  
  // NOTE: Consider adding an 'issueDate' field if you need to track certificate validity/expiration.
}