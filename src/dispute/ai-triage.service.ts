import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { Dispute, DisputeStatus } from '@prisma/client';
import { Decimal } from 'decimal.js';

@Injectable()
export class AiTriageService {
  private readonly logger = new Logger(AiTriageService.name);
  private readonly AUTO_RESOLVE_THRESHOLD = 10000; // NGN 10,000

  constructor(private readonly prisma: PrismaService) {}

  /**
   * AI-assisted dispute triage
   * Analyzes dispute and suggests resolution
   */
  async triageDispute(disputeId: string): Promise<{
    suggestedStatus: DisputeStatus;
    confidence: number;
    reasoning: string;
    suggestedRefund?: number;
  }> {
    const operation = `Triage dispute ${disputeId}`;
    this.logger.log(`[${operation}]`);

    try {
      const dispute = await this.prisma.dispute.findUnique({
        where: { id: disputeId },
        include: {
          booking: {
            include: {
              segments: {
                include: {
                  payments: true,
                },
              },
            },
          },
        },
      });

      if (!dispute) {
        throw new InternalServerErrorException('Dispute not found');
      }

      if (!dispute.booking) {
        throw new InternalServerErrorException('Dispute has no linked booking');
      }

      // Get booking amount
      const bookingAmount = dispute.booking.segments.reduce(
        (sum, segment) => {
          const successPay = segment.payments?.find((p) => p.status === 'SUCCESS');
          if (successPay) return sum.plus(successPay.amount || 0);
          return sum;
        },
        new Decimal(0),
      );

      // Analyze dispute
      const analysis = this.analyzeDispute(dispute, bookingAmount);

      return {
        suggestedStatus: analysis.status,
        confidence: analysis.confidence,
        reasoning: analysis.reasoning,
        suggestedRefund: analysis.refund,
      };
    } catch (error) {
      this.logger.error(`[${operation}] Failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to triage dispute');
    }
  }

  private analyzeDispute(dispute: Dispute, bookingAmount: Decimal): {
    status: DisputeStatus;
    confidence: number;
    reasoning: string;
    refund?: number;
  } {
    // Rule 1: Auto-resolve if amount < threshold
    if (bookingAmount.lessThan(this.AUTO_RESOLVE_THRESHOLD)) {
      return {
        status: DisputeStatus.RESOLVED,
        confidence: 0.9,
        reasoning: `Booking amount (${bookingAmount.toNumber()}) is below auto-resolve threshold (${this.AUTO_RESOLVE_THRESHOLD}). Suggesting full refund.`,
        refund: bookingAmount.toNumber(),
      };
    }

    // Rule 2: Check evidence
    const hasEvidence = dispute.evidenceUrls && dispute.evidenceUrls.length > 0;
    if (!hasEvidence) {
      return {
        status: DisputeStatus.PENDING,
        confidence: 0.7,
        reasoning: 'No evidence provided. Requires manual review.',
      };
    }

    // Rule 3: Analyze reason keywords
    const reason = dispute.reason.toLowerCase();
    const urgentKeywords = ['not completed', 'damaged', 'wrong', 'broken', 'failed'];
    const hasUrgentKeywords = urgentKeywords.some((keyword) => reason.includes(keyword));

    if (hasUrgentKeywords) {
      return {
        status: DisputeStatus.PENDING,
        confidence: 0.8,
        reasoning: 'Dispute contains urgent keywords. Requires priority review.',
      };
    }

    // Rule 4: Default to pending for manual review
    return {
      status: DisputeStatus.PENDING,
      confidence: 0.6,
      reasoning: 'Dispute requires manual review by admin.',
    };
  }

  /**
   * Batch triage multiple disputes
   */
  async batchTriage(disputeIds: string[]): Promise<Array<{
    disputeId: string;
    suggestedStatus: DisputeStatus;
    confidence: number;
    reasoning: string;
  }>> {
    const results = await Promise.all(
      disputeIds.map(async (id) => {
        try {
          const triage = await this.triageDispute(id);
          return {
            disputeId: id,
            suggestedStatus: triage.suggestedStatus,
            confidence: triage.confidence,
            reasoning: triage.reasoning,
          };
        } catch (error) {
          this.logger.error(`Failed to triage dispute ${id}: ${error.message}`);
          return {
            disputeId: id,
            suggestedStatus: DisputeStatus.PENDING,
            confidence: 0,
            reasoning: 'Triage failed - requires manual review',
          };
        }
      }),
    );

    return results;
  }
}
