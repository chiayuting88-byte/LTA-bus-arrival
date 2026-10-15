import {
  BusStop,
  BusServiceArrival,
  BusArrivalEstimate,
  ActiveBusVehicle,
  BusLoad,
  BusType,
  BusOperator,
  BackendConfig,
} from '../types/bus';
import { SINGAPORE_BUS_STOPS, BUS_OPERATOR_MAP, BUS_ROUTES } from '../data/singaporeBuses';

const DEFAULT_CONFIG: BackendConfig = {
  useMockSimulation: true,
  backendBaseUrl: '',
  ltaApiKey: '',
  autoRefreshIntervalSeconds: 15,
};

// Storage key for custom backend config & favorites
const CONFIG_STORAGE_KEY = 'sg_bus_backend_config';
const FAVORITES_STORAGE_KEY = 'sg_bus_favorite_stops';

export function getStoredBackendConfig(): BackendConfig {
  try {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (raw) return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch (e) {
    console.warn('Failed to parse stored backend config', e);
  }
  return DEFAULT_CONFIG;
}

export function saveBackendConfig(config: BackendConfig): void {
  try {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save backend config', e);
  }
}

export function getStoredFavorites(): string[] {
  try {
    const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to parse favorites', e);
  }
  return ['01012', '03011', '08057']; // Default favorites: Bugis, Orchard, Chinatown
}

export function toggleFavoriteStop(busStopCode: string): string[] {
  const current = getStoredFavorites();
  const next = current.includes(busStopCode)
    ? current.filter((c) => c !== busStopCode)
    : [...current, busStopCode];
  try {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(next));
  } catch (e) {
    console.error('Failed to save favorites', e);
  }
  return next;
}

// Deterministic seed helper for realistic consistent estimates
function getSeedNumber(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

// Generate realistic simulated arrivals adhering to LTA DataMall BusArrivalv2 schema
export function generateSimulatedArrivals(busStop: BusStop, now: Date = new Date()): BusServiceArrival[] {
  const services = busStop.services;
  const nowMs = now.getTime();

  return services.map((serviceNo, sIndex) => {
    const operator = BUS_OPERATOR_MAP[serviceNo] || (sIndex % 2 === 0 ? 'SBST' : 'SMRT');
    const seed = getSeedNumber(`${busStop.busStopCode}-${serviceNo}`);
    
    // Vary the 1st bus wait time between 0 min (ARR) and 12 min based on current time
    const timeOffsetSec = Math.floor(nowMs / 1000);
    const cyclePeriod = 720; // 12-minute cycle
    const cyclePos = (timeOffsetSec + seed) % cyclePeriod;
    
    // First bus wait in seconds (0 to 600s)
    const next1WaitSec = Math.max(15, 600 - (cyclePos % 600));
    // Second bus is 7-12 minutes after the first
    const next2WaitSec = next1WaitSec + 420 + ((seed * 17) % 240);
    // Third bus is 8-15 minutes after the second
    const next3WaitSec = next2WaitSec + 480 + ((seed * 29) % 360);

    const makeEstimate = (waitSec: number, seqIndex: number): BusArrivalEstimate => {
      const arrDate = new Date(nowMs + waitSec * 1000);
      const isDD = ((seed + seqIndex * 3) % 10) > 3; // 60% double deck
      const isBendy = !isDD && serviceNo === '190' && ((seed + seqIndex) % 2 === 0);
      const type: BusType = isBendy ? 'BD' : isDD ? 'DD' : 'SD';
      
      const loads: BusLoad[] = ['SEA', 'SEA', 'SDA', 'SEA', 'SDA', 'LSD'];
      const load = loads[(seed + seqIndex * 7) % loads.length];
      
      // Compute GPS position upstream along an approach heading
      const angleRad = ((seed % 8) * 45 * Math.PI) / 180;
      const speedKmH = Math.max(18, Math.min(52, 28 + (seed % 20)));
      const distMeters = Math.round((speedKmH * 1000 / 3600) * waitSec);
      
      // Approx 1 deg lat = 111,000m
      const latOffset = (distMeters / 111000) * Math.cos(angleRad);
      const lngOffset = (distMeters / (111000 * Math.cos((busStop.latitude * Math.PI) / 180))) * Math.sin(angleRad);

      const platePrefixes = { SBST: 'SBS', SMRT: 'SMB', TTS: 'SG', GAS: 'SG' };
      const plateNum = `${platePrefixes[operator]}${3000 + ((seed * 13 + seqIndex * 101) % 4000)}${String.fromCharCode(65 + (seed % 26))}`;

      return {
        estimatedArrival: arrDate.toISOString(),
        latitude: Number((busStop.latitude + latOffset).toFixed(5)),
        longitude: Number((busStop.longitude + lngOffset).toFixed(5)),
        visitNumber: 1,
        load,
        feature: 'WAB',
        type,
        bearing: Math.round(((angleRad * 180) / Math.PI + 180) % 360),
        speed: speedKmH,
        vehiclePlate: plateNum,
        distanceMeters: distMeters,
        secondsRemaining: waitSec,
      };
    };

    // Realistic destination based on known route or terminal
    let destinationName = 'Interchange';
    const knownRoute = BUS_ROUTES[serviceNo];
    if (knownRoute) {
      destinationName = knownRoute.destinationName;
    } else {
      const commonTerms = ['Tampines Int', 'Jurong East Int', 'Woodlands Int', 'Bedok Int', 'Bishan Int', 'Marina Centre Ter', 'HarbourFront', 'Clementi Int', 'Toa Payoh Int'];
      destinationName = commonTerms[(seed + sIndex) % commonTerms.length];
    }

    return {
      serviceNo,
      operator,
      destinationCode: '99999',
      destinationName,
      nextBus: makeEstimate(next1WaitSec, 1),
      nextBus2: makeEstimate(next2WaitSec, 2),
      nextBus3: makeEstimate(next3WaitSec, 3),
    };
  });
}

// Fetch bus arrival for a specific bus stop code
export async function fetchBusArrivals(
  busStopCode: string,
  config: BackendConfig = getStoredBackendConfig()
): Promise<{ arrivals: BusServiceArrival[]; isLiveApi: boolean; error?: string }> {
  // If user configured a real backend URL, attempt real request
  if (!config.useMockSimulation && config.backendBaseUrl) {
    try {
      const response = await fetch(
        `${config.backendBaseUrl.replace(/\/$/, '')}/api/bus-arrival?BusStopCode=${encodeURIComponent(busStopCode)}`,
        {
          headers: config.ltaApiKey ? { 'AccountKey': config.ltaApiKey } : undefined,
        }
      );
      if (!response.ok) {
        throw new Error(`Backend returned status ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      // Parse LTA format: { Services: [{ ServiceNo, Operator, NextBus: {...}, NextBus2, NextBus3 }] }
      if (data && Array.isArray(data.Services)) {
        const parsed: BusServiceArrival[] = data.Services.map((svc: any) => {
          const mapEst = (item: any): BusArrivalEstimate | null => {
            if (!item || !item.EstimatedArrival) return null;
            const diffSec = Math.max(0, Math.floor((new Date(item.EstimatedArrival).getTime() - Date.now()) / 1000));
            return {
              estimatedArrival: item.EstimatedArrival,
              latitude: Number(item.Latitude) || 0,
              longitude: Number(item.Longitude) || 0,
              visitNumber: Number(item.VisitNumber) || 1,
              load: (item.Load as BusLoad) || 'SEA',
              feature: (item.Feature as any) || '',
              type: (item.Type as BusType) || 'SD',
              secondsRemaining: diffSec,
            };
          };

          return {
            serviceNo: svc.ServiceNo,
            operator: (svc.Operator as BusOperator) || 'SBST',
            destinationCode: svc.DestinationCode || '',
            destinationName: 'Terminus',
            nextBus: mapEst(svc.NextBus),
            nextBus2: mapEst(svc.NextBus2),
            nextBus3: mapEst(svc.NextBus3),
          };
        });

        return { arrivals: parsed, isLiveApi: true };
      }
    } catch (err: any) {
      console.warn('Real backend fetch failed, falling back to simulated engine:', err.message);
      // Fallback
      const foundStop = SINGAPORE_BUS_STOPS.find((s) => s.busStopCode === busStopCode) || createSyntheticStop(busStopCode);
      return {
        arrivals: generateSimulatedArrivals(foundStop),
        isLiveApi: false,
        error: `Backend error: ${err.message}. Showing simulated LTA stream.`,
      };
    }
  }

  // Simulated precision real-time arrivals
  const foundStop = SINGAPORE_BUS_STOPS.find((s) => s.busStopCode === busStopCode) || createSyntheticStop(busStopCode);
  return {
    arrivals: generateSimulatedArrivals(foundStop),
    isLiveApi: false,
  };
}

// Generate realistic synthetic stop if user enters an arbitrary 5-digit code not in our top 30
export function createSyntheticStop(code: string): BusStop {
  const seed = getSeedNumber(code);
  const lats = [1.3521, 1.3000, 1.3400, 1.3200, 1.3600, 1.3800];
  const lngs = [103.8198, 103.8500, 103.7400, 103.9000, 103.8600, 103.7600];
  const lat = lats[seed % lats.length] + ((seed % 100) - 50) * 0.0003;
  const lng = lngs[seed % lngs.length] + (((seed * 7) % 100) - 50) * 0.0003;

  const sampleSvcs = ['2', '7', '10', '12', '14', '65', '106', '143', '147', '190', '960'];
  const count = 3 + (seed % 4);
  const pickedSvcs = Array.from(new Set(Array.from({ length: count }, (_, i) => sampleSvcs[(seed + i * 2) % sampleSvcs.length])));

  return {
    busStopCode: code,
    roadName: `Transit Way ${code.slice(0, 2)}`,
    description: `Bus Stop ${code}`,
    latitude: Number(lat.toFixed(5)),
    longitude: Number(lng.toFixed(5)),
    services: pickedSvcs,
    zone: 'Singapore Region',
    mrtProximity: 'LTA Transit Network',
  };
}

// Search bus stops
export function searchBusStops(query: string): BusStop[] {
  const clean = query.trim().toLowerCase();
  if (!clean) return SINGAPORE_BUS_STOPS;

  return SINGAPORE_BUS_STOPS.filter(
    (stop) =>
      stop.busStopCode.includes(clean) ||
      stop.description.toLowerCase().includes(clean) ||
      stop.roadName.toLowerCase().includes(clean) ||
      (stop.zone && stop.zone.toLowerCase().includes(clean)) ||
      (stop.mrtProximity && stop.mrtProximity.toLowerCase().includes(clean)) ||
      stop.services.some((svc) => svc.toLowerCase() === clean)
  );
}

// Calculate distance in meters using Haversine formula
export function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // metres
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

// Find nearest bus stops from coordinate
export function findNearestBusStops(userLat: number, userLng: number, limit = 5): Array<BusStop & { distanceMeters: number }> {
  return SINGAPORE_BUS_STOPS.map((stop) => ({
    ...stop,
    distanceMeters: calculateDistanceMeters(userLat, userLng, stop.latitude, stop.longitude),
  }))
    .sort((a, b) => a.distanceMeters - b.distanceMeters)
    .slice(0, limit);
}

// Generate active moving fleet buses in Singapore for the interactive map
export function getActiveFleetBuses(activeStop: BusStop, arrivals: BusServiceArrival[]): ActiveBusVehicle[] {
  const vehicles: ActiveBusVehicle[] = [];

  arrivals.forEach((svc) => {
    if (svc.nextBus && svc.nextBus.latitude && svc.nextBus.longitude) {
      vehicles.push({
        vehicleId: `${svc.serviceNo}-1`,
        serviceNo: svc.serviceNo,
        operator: svc.operator,
        plateNumber: svc.nextBus.vehiclePlate || `SG${Math.floor(1000 + Math.random() * 8999)}A`,
        latitude: svc.nextBus.latitude,
        longitude: svc.nextBus.longitude,
        bearing: svc.nextBus.bearing || 90,
        speed: svc.nextBus.speed || 32,
        type: svc.nextBus.type,
        load: svc.nextBus.load,
        feature: svc.nextBus.feature,
        currentStopSequence: 1,
        nextStopCode: activeStop.busStopCode,
        destinationName: svc.destinationName,
      });
    }

    if (svc.nextBus2 && svc.nextBus2.latitude && svc.nextBus2.longitude) {
      vehicles.push({
        vehicleId: `${svc.serviceNo}-2`,
        serviceNo: svc.serviceNo,
        operator: svc.operator,
        plateNumber: svc.nextBus2.vehiclePlate || `SG${Math.floor(1000 + Math.random() * 8999)}B`,
        latitude: svc.nextBus2.latitude,
        longitude: svc.nextBus2.longitude,
        bearing: svc.nextBus2.bearing || 120,
        speed: svc.nextBus2.speed || 38,
        type: svc.nextBus2.type,
        load: svc.nextBus2.load,
        feature: svc.nextBus2.feature,
        currentStopSequence: 2,
        nextStopCode: activeStop.busStopCode,
        destinationName: svc.destinationName,
      });
    }
  });

  return vehicles;
}
