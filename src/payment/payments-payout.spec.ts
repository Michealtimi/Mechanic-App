import { PaymentsService } from './payments.services';
import { PaymentGatewayFactory } from './payment-gateway.factory';
import { ConfigService } from '@nestjs/config';

describe('PaymentsService.initiatePayoutTransfer', () => {
  it('delegates to gateway initiateTransfer', async () => {
    const initiateTransfer = jest.fn().mockResolvedValue({
      success: true,
      providerRef: 'TRF_123',
      message: 'ok',
      raw: {},
    });
    const gatewayFactory = {
      resolve: jest.fn().mockReturnValue({ initiateTransfer }),
    } as unknown as PaymentGatewayFactory;

    const config = {
      get: jest.fn((key: string) => (key === 'DEFAULT_CURRENCY' ? 'NGN' : undefined)),
    } as unknown as ConfigService;

    const service = new PaymentsService(
      {} as any,
      gatewayFactory,
      config,
      {} as any,
      {} as any,
      { recordOrIgnore: jest.fn() } as any,
      { increment: jest.fn(), observe: jest.fn() } as any,
    );

    const result = await service.initiatePayoutTransfer({
      amount: 500000,
      bankAccountNumber: '0123456789',
      bankCode: '058',
      recipientName: 'Mechanic One',
      reference: 'payout-uuid-1',
      countryCode: 'NG',
    });

    expect(initiateTransfer).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 500000,
        bankAccountNumber: '0123456789',
        internalReference: 'payout-uuid-1',
        currency: 'NGN',
      }),
    );
    expect(result.success).toBe(true);
    expect(result.providerRef).toBe('TRF_123');
  });
});
