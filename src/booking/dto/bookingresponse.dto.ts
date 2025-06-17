
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, IsDateString } from 'class-validator';

export class bookingResponseDto {
    
    @ApiProperty({ example: 'mechanic id', description: 'Unique ID of the mechanic ' })
    @IsUUID()
    mechanicId: string;
    
    @ApiProperty({ example: 'uuid-of-service', description: 'Unique ID of the service' })
    @IsUUID()
    serviceId:  string;

    @ApiProperty({ example: new Date().toISOString(), description: 'Date the service was created' })
    @IsDateString()
    schedudledAt: Date;
    
    @ApiProperty({ example: 'ststus' , description: 'status of Service' })
    status?: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
}