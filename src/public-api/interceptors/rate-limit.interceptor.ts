import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class RateLimitInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RateLimitInterceptor.name);
  private readonly requestCounts = new Map<string, { count: number; resetAt: number }>();

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.apiKey;

    if (!apiKey) {
      // No rate limiting for non-API key requests
      return next.handle();
    }

    const key = `api:${apiKey.userId}:${request.ip}`;
    const rateLimit = apiKey.rateLimit || 60;
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute

    // Get or create rate limit record
    let record = this.requestCounts.get(key);
    if (!record || now > record.resetAt) {
      record = { count: 0, resetAt: now + windowMs };
      this.requestCounts.set(key, record);
    }

    // Check rate limit
    if (record.count >= rateLimit) {
      this.logger.warn(`Rate limit exceeded for ${key}: ${record.count}/${rateLimit}`);
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Rate limit exceeded',
          retryAfter: Math.ceil((record.resetAt - now) / 1000),
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Increment counter
    record.count++;

    return next.handle().pipe(
      tap(() => {
        // Request completed successfully
      }),
    );
  }
}
