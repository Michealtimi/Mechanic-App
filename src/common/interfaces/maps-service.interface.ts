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
  /**
   * Compute distance and travel duration between two coordinates.
   * Implementations may use OSRM, OpenRouteService, or a simple Haversine fallback.
   */
  getDistanceAndDuration(
    origin: Location,
    destination: Location,
  ): Promise<{ distanceMeters: number; durationSeconds: number }>;

  /**
   * Forward geocode: address → coordinates.
   */
  geocodeAddress(address: string): Promise<Location>;

  /**
   * Optional: basic point‑to‑point route details.
   */
  getRoute?(
    origin: Location,
    destination: Location,
  ): Promise<{
    distanceMeters: number;
    durationSeconds: number;
    polyline?: string | null;
    steps?: Array<{
      distance: number;
      duration: number;
      instruction: string;
      location: Location;
    }>;
  }>;
}
