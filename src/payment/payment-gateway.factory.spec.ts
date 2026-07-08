import { ConfigService } from '@nestjs/config';
import { PaymentGatewayFactory } from './payment-gateway.factory';

describe('PaymentGatewayFactory', () => {
  const config = {
    get: jest.fn((key: string) => {
      const map: Record<string, string> = {
        PAYMENT_GATEWAY: 'SANDBOX',
        PAYMENT_GATEWAY_BY_COUNTRY: '{"NG":"PAYSTACK","US":"STRIPE","KE":"FLUTTERWAVE"}',
        PAYMENT_GATEWAY_BY_CURRENCY: '{"NGN":"PAYSTACK","USD":"STRIPE"}',
        DEFAULT_CURRENCY: 'NGN',
      };
      return map[key];
    }),
  } as unknown as ConfigService;

  let factory: PaymentGatewayFactory;

  beforeEach(() => {
    factory = new PaymentGatewayFactory(config);
  });

  it('routes Nigeria to Paystack by country map', () => {
    expect(factory.resolveName({ countryCode: 'NG' })).toBe('PAYSTACK');
  });

  it('routes US to Stripe by country map', () => {
    expect(factory.resolveName({ countryCode: 'US' })).toBe('STRIPE');
  });

  it('routes USD to Stripe by currency map', () => {
    expect(factory.resolveName({ currency: 'USD' })).toBe('STRIPE');
  });

  it('honours explicit gateway override', () => {
    expect(factory.resolveName({ gateway: 'FLUTTERWAVE', countryCode: 'US' })).toBe('FLUTTERWAVE');
  });
});
