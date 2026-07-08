import { Test, TestingModule } from '@nestjs/testing';
import { DispatchController } from 'src/dispatch/dispatch.controller';
import { DispatchService } from 'src/dispatch/dispatch.service';

describe('DispatchController', () => {
  let controller: DispatchController;
  let dispatchService: jest.Mocked<DispatchService>;

  const mockReq = (id: string, extra: Record<string, any> = {}) =>
    ({ user: { id, ...extra } } as any);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DispatchController],
      providers: [
        {
          provide: DispatchService,
          useValue: {
            getAvailableMechanics: jest.fn(),
            createDispatch: jest.fn(),
            acceptDispatch: jest.fn(),
            rejectDispatch: jest.fn(),
            createDispatchWithBidding: jest.fn(),
            getAnalytics: jest.fn(),
            predictMechanicAvailability: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<DispatchController>(DispatchController);
    dispatchService = module.get(DispatchService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('getAvailableMechanics should call service with parsed numbers', async () => {
    const result = [{ id: 'mech-1' }];
    dispatchService.getAvailableMechanics.mockResolvedValue(result as any);

    const resp = await controller.getAvailableMechanics('1.23', '4.56', '7.89');
    expect(dispatchService.getAvailableMechanics).toHaveBeenCalledWith(1.23, 4.56, 7.89);
    expect(resp).toEqual(result);
  });

  it('create should call service with dto and user id', async () => {
    const dto: any = { bookingId: 'b1' };
    const req = mockReq('admin-1');
    const result = { id: 'dispatch-1' };
    dispatchService.createDispatch.mockResolvedValue(result as any);

    const resp = await controller.create(req as any, dto);
    expect(dispatchService.createDispatch).toHaveBeenCalledWith(dto, 'admin-1');
    expect(resp).toEqual(result);
  });

  it('accept should call service with dispatch id and mechanic id', async () => {
    const req = mockReq('mech-1');
    const result = { id: 'dispatch-1' };
    dispatchService.acceptDispatch.mockResolvedValue(result as any);

    const resp = await controller.accept(req as any, 'dispatch-1');
    expect(dispatchService.acceptDispatch).toHaveBeenCalledWith('dispatch-1', 'mech-1');
    expect(resp).toEqual(result);
  });

  it('reject should call service with dispatch id, mechanic id and reason', async () => {
    const req = mockReq('mech-1');
    const body = { reason: 'Busy' };
    const result = { id: 'dispatch-1' };
    dispatchService.rejectDispatch.mockResolvedValue(result as any);

    const resp = await controller.reject(req as any, 'dispatch-1', body as any);
    expect(dispatchService.rejectDispatch).toHaveBeenCalledWith('dispatch-1', 'mech-1', 'Busy');
    expect(resp).toEqual(result);
  });

  it('createWithBidding should call service with bookingId and parsed maxBids', async () => {
    const result = [{ id: 'dispatch-1' }];
    dispatchService.createDispatchWithBidding.mockResolvedValue(result as any);

    const resp = await controller.createWithBidding('b1', '5');
    expect(dispatchService.createDispatchWithBidding).toHaveBeenCalledWith('b1', 5);
    expect(resp).toEqual(result);
  });

  it('getAnalytics should call service with dates and tenant from params or request', async () => {
    const result = { total: 1 };
    dispatchService.getAnalytics.mockResolvedValue(result as any);
    const req = mockReq('admin-1', { tenantId: 'tenant-1' });

    const resp = await controller.getAnalytics(
      '2026-01-01',
      '2026-01-31',
      undefined,
      req,
    );

    expect(dispatchService.getAnalytics).toHaveBeenCalledWith(
      new Date('2026-01-01'),
      new Date('2026-01-31'),
      'tenant-1',
    );
    expect(resp).toEqual(result);
  });

  it('getMechanicAvailability should call service with mechanicId', async () => {
    const result = { mechanicId: 'mech-1' };
    dispatchService.predictMechanicAvailability.mockResolvedValue(result as any);

    const resp = await controller.getMechanicAvailability('mech-1');
    expect(dispatchService.predictMechanicAvailability).toHaveBeenCalledWith('mech-1');
    expect(resp).toEqual(result);
  });
}

