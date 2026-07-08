import { Test, TestingModule } from '@nestjs/testing';
import { GeoController } from 'src/location/location.controller';
import { GeoService } from 'src/location/geo.service';

describe('GeoController', () => {
  let controller: GeoController;
  let geoService: jest.Mocked<GeoService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GeoController],
      providers: [
        {
          provide: GeoService,
          useValue: {
            updateMechanicLocation: jest.fn(),
            geocode: jest.fn(),
            getDistance: jest.fn(),
            findNearbyMechanics: jest.fn(),
            getMechanicLocation: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<GeoController>(GeoController);
    geoService = module.get(GeoService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('updateLocation should call service with mechanicId and coordinates', async () => {
    const mechanicId = 'mech-1';
    const dto = { lat: 1.23, lng: 4.56 } as any;
    const updated = { id: mechanicId, currentLat: 1.23, currentLng: 4.56 };
    geoService.updateMechanicLocation.mockResolvedValue(updated as any);

    const result = await controller.updateLocation(mechanicId, dto, {} as any);
    expect(geoService.updateMechanicLocation).toHaveBeenCalledWith(
      mechanicId,
      1.23,
      4.56,
    );
    expect(result.id).toBe(mechanicId);
  });

  it('geocode should delegate to GeoService.geocode', async () => {
    const resp = { lat: 1, lng: 2, address: 'A', formattedAddress: 'A' };
    geoService.geocode.mockResolvedValue(resp as any);

    const result = await controller.geocode('some address');
    expect(geoService.geocode).toHaveBeenCalledWith('some address');
    expect(result).toEqual(resp);
  });

  it('distance should delegate to GeoService.getDistance', async () => {
    const resp = { distance: 10, duration: 15, eta: '2026-01-01T00:00:00.000Z' };
    geoService.getDistance.mockResolvedValue(resp as any);

    const result = await controller.distance('origin', 'dest');
    expect(geoService.getDistance).toHaveBeenCalledWith('origin', 'dest');
    expect(result).toEqual(resp);
  });

  it('getNearby should delegate to GeoService.findNearbyMechanics', async () => {
    const dto: any = { lat: 1.23, lng: 4.56, radiusKm: 10 };
    const resp = [{ id: 'mech-1' }];
    geoService.findNearbyMechanics.mockResolvedValue(resp as any);

    const result = await controller.getNearby(dto);
    expect(geoService.findNearbyMechanics).toHaveBeenCalledWith(1.23, 4.56, 10);
    expect(result[0].id).toBe('mech-1');
  });

  it('getMechanicLocation should delegate to GeoService.getMechanicLocation', async () => {
    const mechanic = { id: 'mech-1' };
    geoService.getMechanicLocation.mockResolvedValue(mechanic as any);

    const result = await controller.getMechanicLocation('mech-1');
    expect(geoService.getMechanicLocation).toHaveBeenCalledWith('mech-1');
    expect(result.id).toBe('mech-1');
  });
}

