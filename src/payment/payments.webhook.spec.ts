/* eslint-disable @typescript-eslint/no-explicit-any -- webhook tests use partial mocks */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn().mockResolvedValue(undefined),
    duplicate: jest.fn().mockReturnValue({
      connect: jest.fn().mockResolvedValue(undefined),
      on: jest.fn(),
    }),
    on: jest.fn(),
  })),
}));

jest.mock('@socket.io/redis-adapter', () => ({
  createAdapter: jest.fn(),
}));

import { createHmac } from 'crypto';
import {
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PaymentsService } from './payments.services';
import { PaymentGatewayFactory } from './payment-gateway.factory';
import { PaymentStatus, PaymentEventType } from '@prisma/client';

describe('PaymentsService webhooks', () => {
  const webhookSecret = 'test-paystack-webhook-secret';
  const flwSecret = 'test-flw-webhook-secret';

  let service: PaymentsService;
  let prisma: {
    payment: { findUnique: jest.Mock; updateMany: jest.Mock };
  };
  let config: { get: jest.Mock };
  let auditLog: { recordOrIgnore: jest.Mock };
  let metrics: { increment: jest.Mock };
  let verifyPaymentSpy: jest.SpyInstance;

  beforeEach(() => {
    prisma = {
      payment: {
        findUnique: jest.fn(),
        updateMany: jest.fn(),
      },
    };
    config = {
      get: jest.fn((key: string) => {
        if (key === 'PAYSTACK_WEBHOOK_SECRET') return webhookSecret;
        if (key === 'FLW_WEBHOOK_SECRET') return flwSecret;
        return undefined;
      }),
    };
    auditLog = { recordOrIgnore: jest.fn().mockResolvedValue(undefined) };
    metrics = { increment: jest.fn() };

    const gateway = { verifyPayment: jest.fn(), refund: jest.fn() };
    const gatewayFactory = {
      resolve: jest.fn().mockReturnValue(gateway),
      resolveName: jest.fn().mockReturnValue('PAYSTACK'),
      getDefault: jest.fn().mockReturnValue(gateway),
    } as unknown as PaymentGatewayFactory;
    const wallet = {} as any;
    const notification = {} as any;

    service = new PaymentsService(
      prisma as any,
      gatewayFactory,
      config as any,
      wallet,
      notification,
      auditLog as any,
      metrics as any,
    );

    verifyPaymentSpy = jest.spyOn(service, 'verifyPayment').mockResolvedValue({
      id: 'pay-1',
      status: PaymentStatus.SUCCESS,
    } as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('handlePaystackWebhook', () => {
    it('rejects when webhook secret is not configured', async () => {
      config.get.mockImplementation(() => undefined);
      const raw = Buffer.from('{}');
      await expect(
        service.handlePaystackWebhook('sig', raw),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });

    it('rejects invalid HMAC signature', async () => {
      const raw = Buffer.from(
        '{"event":"charge.success","data":{"reference":"REF-1"}}',
      );
      await expect(
        service.handlePaystackWebhook('not-a-valid-signature', raw),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('rejects payload without reference', async () => {
      const raw = Buffer.from('{"event":"charge.success","data":{}}');
      const sig = createHmac('sha512', webhookSecret).update(raw).digest('hex');
      await expect(
        service.handlePaystackWebhook(sig, raw),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('accepts valid signature and calls verifyPayment on charge.success', async () => {
      const body = {
        event: 'charge.success',
        data: { reference: 'REF-ABC', id: 'evt-1' },
      };
      const raw = Buffer.from(JSON.stringify(body));
      const sig = createHmac('sha512', webhookSecret).update(raw).digest('hex');

      prisma.payment.findUnique.mockResolvedValue({
        id: 'pay-1',
        reference: 'REF-ABC',
        status: PaymentStatus.PENDING,
      });

      await service.handlePaystackWebhook(sig, raw);

      expect(auditLog.recordOrIgnore).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentId: 'pay-1',
          gateway: 'PAYSTACK',
          type: PaymentEventType.WEBHOOK,
        }),
      );
      expect(verifyPaymentSpy).toHaveBeenCalledWith('REF-ABC', 'PAYSTACK');
    });

    it('returns early when payment record is unknown (idempotent no-op)', async () => {
      const body = { event: 'charge.success', data: { reference: 'UNKNOWN' } };
      const raw = Buffer.from(JSON.stringify(body));
      const sig = createHmac('sha512', webhookSecret).update(raw).digest('hex');
      prisma.payment.findUnique.mockResolvedValue(null);

      await service.handlePaystackWebhook(sig, raw);

      expect(verifyPaymentSpy).not.toHaveBeenCalled();
    });

    it('marks payment failed on charge.failed', async () => {
      const body = {
        event: 'charge.failed',
        data: { reference: 'REF-FAIL', id: 'e2' },
      };
      const raw = Buffer.from(JSON.stringify(body));
      const sig = createHmac('sha512', webhookSecret).update(raw).digest('hex');
      prisma.payment.findUnique.mockResolvedValue({
        id: 'p2',
        reference: 'REF-FAIL',
      });

      await service.handlePaystackWebhook(sig, raw);

      expect(prisma.payment.updateMany).toHaveBeenCalledWith({
        where: { reference: 'REF-FAIL' },
        data: { status: 'FAILED' },
      });
      expect(metrics.increment).toHaveBeenCalledWith('payments_failed_total');
      expect(verifyPaymentSpy).not.toHaveBeenCalled();
    });
  });

  describe('handleFlutterwaveWebhook', () => {
    it('rejects when FLW_WEBHOOK_SECRET is missing', async () => {
      config.get.mockImplementation(() => undefined);
      const raw = Buffer.from('{}');
      await expect(
        service.handleFlutterwaveWebhook('anything', raw),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });

    it('rejects when verif-hash does not match secret', async () => {
      const raw = Buffer.from(
        JSON.stringify({
          event: 'charge.completed',
          data: { tx_ref: 'FLW-1', status: 'successful' },
        }),
      );
      await expect(
        service.handleFlutterwaveWebhook('wrong-hash', raw),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('accepts matching secret and verifies payment on success', async () => {
      const body = {
        event: 'charge.completed',
        data: { tx_ref: 'FLW-REF', id: 99, status: 'successful' },
      };
      const raw = Buffer.from(JSON.stringify(body));
      prisma.payment.findUnique.mockResolvedValue({
        id: 'p3',
        reference: 'FLW-REF',
      });

      await service.handleFlutterwaveWebhook(flwSecret, raw);

      expect(auditLog.recordOrIgnore).toHaveBeenCalledWith(
        expect.objectContaining({
          gateway: 'FLUTTERWAVE',
          type: PaymentEventType.WEBHOOK,
        }),
      );
      expect(verifyPaymentSpy).toHaveBeenCalledWith('FLW-REF', 'FLUTTERWAVE');
    });
  });
});
