import { Controller, Post, Get, Body, Param, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { VinService } from './vin.service';
import { CheckVinDto } from './dto/check-vin.dto';
import { VinResultResponseDto, VinResultPayloadDto } from './dto/vin-result.response.dto';

@ApiTags('VIN (Trojan Horse)')
@Controller('vin')
export class VinController {
  constructor(private readonly vinService: VinService) {}

  @Public()
  @Post('check')
  @ApiOperation({ summary: 'Decode VIN via NHTSA and return shareable result URL' })
  @ApiResponse({ status: 201, description: 'VIN decoded; redirect to redirectUrl' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded (5 per IP per day)' })
  async check(@Body() dto: CheckVinDto, @Req() req: any) {
    const ip = req?.ip ?? req?.connection?.remoteAddress ?? undefined;
    const userId = req?.user?.id;
    const result = await this.vinService.checkVin(dto.vin.trim().toUpperCase(), ip, userId);
    return result as VinResultResponseDto;
  }

  @Public()
  @Get('result/:shortId')
  @ApiOperation({ summary: 'Get stored VIN result by short ID (public, shareable)' })
  @ApiParam({ name: 'shortId', description: 'Short ID from POST /vin/check' })
  @ApiResponse({ status: 200, description: 'VIN result payload' })
  @ApiResponse({ status: 404, description: 'Not found or expired' })
  async getResult(@Param('shortId') shortId: string) {
    return this.vinService.getResult(shortId);
  }
}
