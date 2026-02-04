/**
 * Interface for distance/duration calculation (e.g. Google Maps).
 * Allows swapping implementation for tests or other providers.
 */
export const MAPS_SERVICE_TOKEN = Symbol('IMapsService');

export interface Location {
  lat: number;
  lng: number;
}

export interface IMapsService {
  getDistanceAndDuration(
    origin: Location,
    destination: Location,
  ): Promise<{ distanceMeters: number; durationSeconds: number }>;
}
