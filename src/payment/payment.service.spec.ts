import { Test } from '@nestjs/testing';
import { PaymentsService } from './payment.services';
import { IPaymentGateway } from '../interface/payment-gateway.interface';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let gatewayMock: IPaymentGateway;

  beforeEach(async () => {
    gatewayMock = {
      initializePayment: jest.fn(),
      verifyPayment: jest.fn(),
      createSubaccount: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: 'IPaymentGateway', useValue: gatewayMock },
      ],
    }).compile();

    service = module.get(PaymentsService);
  });

  it('should initialize payment', async () => {
    (gatewayMock.initializePayment as jest.Mock).mockResolvedValue({ ok: true });

    const result = await service.initialize({
      email: 'test@test.com',
      amount: 10000,
      metadata: {},
    });

    expect(result).toEqual({ ok: true });
  });

  it('should verify payment', async () => {
    (gatewayMock.verifyPayment as jest.Mock).mockResolvedValue({
      status: 'success',
    });

    const result = await service.verify('ref123');
    expect(result.status).toBe('success');
  });
});
