import { Controller, Get, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { Public } from 'src/common/decorators/public.decorator';
import { HealthService, HealthCheckResult } from './health.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Liveness/readiness probe' })
  @ApiResponse({ status: 200, description: 'Service is healthy or degraded (body indicates which)' })
  @ApiResponse({ status: 503, description: 'Service unavailable; retry after Retry-After seconds' })
  async getHealth(@Res() res: Response): Promise<void> {
    const result: HealthCheckResult = await this.healthService.check();

    if (result.status === 'degraded') {
      res.setHeader('Retry-After', String(this.healthService.getRetryAfterSeconds()));
      res.status(503).json({
        statusCode: 503,
        message: 'Service temporarily unavailable',
        ...result,
      });
      return;
    }

    res.status(200).json(result);
  }
}
