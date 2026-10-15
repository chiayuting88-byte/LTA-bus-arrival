export type BusOperator = 'SBST' | 'SMRT' | 'TTS' | 'GAS';

export type BusLoad = 'SEA' | 'SDA' | 'LSD'; // Seats Available, Standing Available, Limited Standing
export type BusType = 'SD' | 'DD' | 'BD'; // Single Deck, Double Deck, Bendy
export type BusFeature = 'WAB' | ''; // Wheelchair Accessible

export interface BusArrivalEstimate {
  estimatedArrival: string; // ISO string or timestamp
  latitude: number;
  longitude: number;
  visitNumber: number;
  load: BusLoad;
  feature: BusFeature;
  type: BusType;
  bearing?: number; // 0-360 degrees
  speed?: number; // km/h
  vehiclePlate?: string;
  distanceMeters?: number;
  secondsRemaining?: number; // dynamic computed value
}

export interface BusServiceArrival {
  serviceNo: string;
  operator: BusOperator;
  destinationCode: string;
  destinationName: string;
  nextBus: BusArrivalEstimate | null;
  nextBus2: BusArrivalEstimate | null;
  nextBus3: BusArrivalEstimate | null;
}

export interface BusStop {
  busStopCode: string; // 5-digit string e.g. "01012"
  roadName: string;
  description: string;
  latitude: number;
  longitude: number;
  services: string[];
  zone?: string;
  mrtProximity?: string;
}

export interface BusRouteStop {
  busStopCode: string;
  description: string;
  roadName: string;
  stopSequence: number;
  distanceKm: number;
  latitude: number;
  longitude: number;
}

export interface BusRouteInfo {
  serviceNo: string;
  operator: BusOperator;
  originCode: string;
  originName: string;
  destinationCode: string;
  destinationName: string;
  firstBus: string;
  lastBus: string;
  headwayPeak: string;
  headwayOffPeak: string;
  stops: BusRouteStop[];
}

export interface ActiveBusVehicle {
  vehicleId: string;
  serviceNo: string;
  operator: BusOperator;
  plateNumber: string;
  latitude: number;
  longitude: number;
  bearing: number;
  speed: number;
  type: BusType;
  load: BusLoad;
  feature: BusFeature;
  currentStopSequence: number;
  nextStopCode: string;
  destinationName: string;
}

export interface BackendConfig {
  useMockSimulation: boolean;
  backendBaseUrl: string;
  ltaApiKey: string;
  autoRefreshIntervalSeconds: number;
}
