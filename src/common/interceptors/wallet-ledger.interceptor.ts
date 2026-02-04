import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * WalletLedgerInterceptor
 * 
 * This interceptor ensures that all wallet operations go through the WalletService
 * ledger methods (creditWalletWithTx, debitWalletWithTx) which create proper
 * transaction records.
 * 
 * Note: This is a safety measure. The primary enforcement is:
 * 1. WalletService methods are the only way to modify wallet balances
 * 2. All balance updates must create WalletTransaction records
 * 3. Direct Prisma wallet.update() calls should be avoided
 * 
 * This interceptor logs warnings if it detects potential direct wallet updates,
 * but cannot prevent them at runtime. Code reviews and linting rules should
 * enforce this pattern.
 */
@Injectable()
export class WalletLedgerInterceptor implements NestInterceptor {
  private readonly logger = new Logger(WalletLedgerInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const handler = context.getHandler();
    const controller = context.getClass();

    // Log wallet-related operations for audit
    if (
      controller.name.includes('Wallet') ||
      handler.name.includes('wallet') ||
      request.url?.includes('/wallet')
    ) {
      this.logger.debug(
        `Wallet operation: ${controller.name}.${handler.name} - ${request.method} ${request.url}`,
      );
    }

    return next.handle().pipe(
      tap({
        next: (data) => {
          // If the response contains wallet data, verify it has transaction records
          if (data && typeof data === 'object') {
            if (data.balance !== undefined && !data.WalletTransaction && !data.transactions) {
              this.logger.warn(
                `Potential direct wallet update detected in ${controller.name}.${handler.name}. ` +
                  `Wallet operations should go through WalletService ledger methods.`,
              );
            }
          }
        },
        error: (error) => {
          this.logger.error(
            `Wallet operation error in ${controller.name}.${handler.name}: ${error.message}`,
          );
        },
      }),
    );
  }
}
