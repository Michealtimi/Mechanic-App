import {
  Injectable,
  Logger,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import Stripe from 'stripe';
import {
  IPaymentGateway,
  InitializePaymentData,
  CreateSubaccountData,
  CreateSubaccountResult,
  VerifyPaymentResult,
  TransferRequest,
  TransferResponse,
  RefundResult,
} from '../interface/payment-gateway.interface';

/** Stripe SDK client instance (typed loosely for SDK version compatibility). */
type StripeClient = {
  checkout: { sessions: { create: (p: unknown) => Promise<{ url: string | null; id: string }>; retrieve: (id: string) => Promise<{ payment_status: string; status: string; amount_total: number | null; payment_intent: string | null }> } };
  paymentIntents: { retrieve: (id: string) => Promise<{ status: string; amount: number }> };
  payouts: { create: (p: unknown) => Promise<{ id: string }> };
  refunds: { create: (p: unknown) => Promise<{ status: string | null }> };
};

@Injectable()
export class StripeGateway implements IPaymentGateway {
  private readonly logger = new Logger(StripeGateway.name);
  private readonly secret: string;
  private readonly currency: string;
  private readonly frontendUrl: string;
  private stripeClient: StripeClient | null = null;

  constructor() {
    this.secret = process.env.STRIPE_SECRET_KEY || '';
    this.currency = (process.env.DEFAULT_CURRENCY || 'USD').toLowerCase();
    this.frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    if (!this.secret && process.env.PAYMENT_GATEWAY === 'STRIPE') {
      this.logger.error('STRIPE_SECRET_KEY is not defined.');
      throw new InternalServerErrorException('Stripe configuration missing.');
    }
  }

  private getStripe(): StripeClient {
    if (!this.secret) {
      throw new InternalServerErrorException('Stripe is not configured');
    }
    if (!this.stripeClient) {
      const client = new (Stripe as unknown as new (
        key: string,
        config: { apiVersion: string },
      ) => StripeClient)(this.secret, {
        apiVersion: '2026-04-22.dahlia',
      });
      this.stripeClient = client;
    }
    return this.stripeClient;
  }

  async initializePayment({
    amount,
    email,
    metadata,
  }: InitializePaymentData): Promise<{ paymentUrl: string; reference: string; raw?: unknown }> {
    const stripe = this.getStripe();
    const currency = (metadata?.currency as string)?.toLowerCase() || this.currency;
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency,
            unit_amount: Math.round(amount),
            product_data: { name: (metadata?.description as string) || 'Mechanic service' },
          },
          quantity: 1,
        },
      ],
      success_url:
        (metadata?.redirectUrl as string) ||
        `${this.frontendUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:
        (metadata?.cancelUrl as string) ||
        `${this.frontendUrl}/payment/cancel`,
      metadata: Object.fromEntries(
        Object.entries(metadata || {}).map(([k, v]) => [k, String(v)]),
      ),
    });

    if (!session.url) {
      throw new InternalServerErrorException('Stripe did not return a checkout URL');
    }

    return {
      paymentUrl: session.url,
      reference: session.id,
      raw: session,
    };
  }

  async verifyPayment(reference: string): Promise<VerifyPaymentResult> {
    const stripe = this.getStripe();
    if (reference.startsWith('cs_')) {
      const session = await stripe.checkout.sessions.retrieve(reference);
      const paid = session.payment_status === 'paid';
      return {
        status: paid ? 'success' : session.status === 'open' ? 'pending' : 'failed',
        amount: session.amount_total ?? 0,
        raw: session,
      };
    }

    const intent = await stripe.paymentIntents.retrieve(reference);
    let status: VerifyPaymentResult['status'] = 'pending';
    if (intent.status === 'succeeded') status = 'success';
    else if (['canceled', 'requires_payment_method'].includes(intent.status)) status = 'failed';

    return {
      status,
      amount: intent.amount,
      raw: intent,
    };
  }

  async createSubaccount(_data: CreateSubaccountData): Promise<CreateSubaccountResult> {
    throw new BadRequestException(
      'Stripe subaccounts use Connect onboarding — not implemented in this gateway',
    );
  }

  async initiateTransfer(request: TransferRequest): Promise<TransferResponse> {
    const stripe = this.getStripe();
    try {
      const payout = await stripe.payouts.create({
        amount: Math.round(request.amount),
        currency: (request.currency || this.currency).toLowerCase(),
        metadata: {
          internalReference: request.internalReference,
          recipientName: request.recipientName,
        },
      });
      return {
        success: true,
        providerRef: payout.id,
        message: 'Payout created',
        raw: payout,
      };
    } catch (err: any) {
      this.logger.error(`Stripe payout failed: ${err.message}`, err.stack);
      return { success: false, message: err.message, raw: err.raw };
    }
  }

  async refund(reference: string, amount?: number): Promise<RefundResult> {
    const stripe = this.getStripe();
    try {
      let paymentIntentId = reference;
      if (reference.startsWith('cs_')) {
        const session = await stripe.checkout.sessions.retrieve(reference);
        paymentIntentId = String(session.payment_intent ?? '');
      }
      const params: { payment_intent: string; amount?: number } = {
        payment_intent: paymentIntentId,
      };
      if (amount != null) params.amount = Math.round(amount);
      const refund = await stripe.refunds.create(params);
      return {
        success: refund.status === 'succeeded' || refund.status === 'pending',
        message: refund.status ?? undefined,
        raw: refund,
      };
    } catch (err: any) {
      this.logger.error(`Stripe refund failed: ${err.message}`);
      return { success: false, message: err.message, raw: err };
    }
  }
}
