/**
 * Telemetry Adapter Interface
 * 
 * All telemetry providers (Smartcar, Tor Loco, etc.) must implement this interface
 */
export interface ITelemetryAdapter {
  /**
   * Provider name (e.g., 'SMARTCAR', 'TOR_LOCO', 'HYUNDAI')
   */
  readonly providerName: string;

  /**
   * Fetch vehicle telemetry data
   */
  fetchTelemetry(vehicleId: string, accessToken: string): Promise<TelemetryData>;

  /**
   * Fetch vehicle location
   */
  fetchLocation(vehicleId: string, accessToken: string): Promise<LocationData>;

  /**
   * Fetch vehicle health status
   */
  fetchHealthStatus(vehicleId: string, accessToken: string): Promise<HealthStatus>;

  /**
   * Validate access token
   */
  validateToken(accessToken: string): Promise<boolean>;
}

export interface TelemetryData {
  vehicleId: string;
  batteryLevel?: number; // 0-100
  soc?: number; // 0-1 (State of Charge)
  rangeKm?: number;
  chargingStatus?: 'CHARGING' | 'NOT_CHARGING' | 'FULLY_CHARGED';
  odometerKm?: number;
  timestamp: Date;
  rawData?: Record<string, any>; // Provider-specific data
}

export interface LocationData {
  vehicleId: string;
  latitude: number;
  longitude: number;
  heading?: number; // 0-360 degrees
  speed?: number; // km/h
  timestamp: Date;
}

export interface HealthStatus {
  vehicleId: string;
  overallHealth: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'CRITICAL';
  batteryHealth?: number; // 0-100
  tirePressure?: {
    frontLeft?: number;
    frontRight?: number;
    rearLeft?: number;
    rearRight?: number;
  };
  maintenanceAlerts?: string[];
  timestamp: Date;
}
