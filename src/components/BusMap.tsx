import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { BusStop, ActiveBusVehicle, BusRouteInfo } from '../types/bus';
import { SINGAPORE_BUS_STOPS } from '../data/singaporeBuses';

interface BusMapProps {
  activeStop: BusStop;
  onSelectStop: (stop: BusStop) => void;
  activeVehicles: ActiveBusVehicle[];
  selectedServiceRoute: BusRouteInfo | null;
  highlightedVehicleId: string | null;
  onSelectVehicle?: (vehicle: ActiveBusVehicle) => void;
}

export const BusMap: React.FC<BusMapProps> = ({
  activeStop,
  onSelectStop,
  activeVehicles,
  selectedServiceRoute,
  highlightedVehicleId,
  onSelectVehicle,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const stopMarkersLayerRef = useRef<L.LayerGroup | null>(null);
  const busMarkersLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLineLayerRef = useRef<L.Polyline | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // OpenStreetMap Carto Positron layer (super clean transit style)
    const map = L.map(mapContainerRef.current, {
      center: [activeStop.latitude, activeStop.longitude],
      zoom: 16,
      zoomControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    stopMarkersLayerRef.current = L.layerGroup().addTo(map);
    busMarkersLayerRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update map center when activeStop changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo([activeStop.latitude, activeStop.longitude], 16, {
      animate: true,
      duration: 0.8,
    });
  }, [activeStop.busStopCode]);

  // Render bus stop markers
  useEffect(() => {
    if (!mapInstanceRef.current || !stopMarkersLayerRef.current) return;

    stopMarkersLayerRef.current.clearLayers();

    SINGAPORE_BUS_STOPS.forEach((stop) => {
      const isSelected = stop.busStopCode === activeStop.busStopCode;

      const html = isSelected
        ? `
          <div class="relative flex items-center justify-center">
            <div class="absolute -inset-2 rounded-full bg-emerald-500/30 animate-ping"></div>
            <div class="relative w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-md border-2 border-white">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 6 2 7"/>
                <path d="M10 6h4"/>
                <path d="m22 7-2-1"/>
                <rect width="16" height="16" x="4" y="3" rx="2"/>
                <path d="M4 11h16"/>
                <path d="M8 15h.01"/>
                <path d="M16 15h.01"/>
                <path d="M6 19v2"/>
                <path d="M18 19v2"/>
              </svg>
            </div>
            <div class="absolute top-10 whitespace-nowrap bg-slate-900 text-white text-[11px] font-semibold px-2 py-0.5 rounded shadow pointer-events-none">
              ${stop.busStopCode} · ${stop.description}
            </div>
          </div>
        `
        : `
          <div class="group relative flex items-center justify-center cursor-pointer">
            <div class="w-6 h-6 rounded-full bg-slate-700 text-white flex items-center justify-center text-[10px] font-semibold border-2 border-white shadow hover:scale-110 transition-transform">
              ●
            </div>
          </div>
        `;

      const icon = L.divIcon({
        className: 'custom-stop-marker',
        html,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const marker = L.marker([stop.latitude, stop.longitude], { icon });
      marker.on('click', () => {
        onSelectStop(stop);
      });

      marker.bindTooltip(`<b>${stop.busStopCode}</b><br/>${stop.description}<br/><span style="color:#64748b">${stop.roadName}</span>`, {
        direction: 'top',
        offset: [0, -16],
      });

      stopMarkersLayerRef.current?.addLayer(marker);
    });
  }, [activeStop.busStopCode, onSelectStop]);

  // Render Route Polyline if selected
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (routeLineLayerRef.current) {
      mapInstanceRef.current.removeLayer(routeLineLayerRef.current);
      routeLineLayerRef.current = null;
    }

    if (selectedServiceRoute && selectedServiceRoute.stops.length > 1) {
      const latlngs: [number, number][] = selectedServiceRoute.stops.map((s) => [s.latitude, s.longitude]);
      routeLineLayerRef.current = L.polyline(latlngs, {
        color: '#059669',
        weight: 4,
        opacity: 0.8,
        dashArray: '4, 8',
      }).addTo(mapInstanceRef.current);
    }
  }, [selectedServiceRoute]);

  // Render Real-Time Bus Fleet Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !busMarkersLayerRef.current) return;

    busMarkersLayerRef.current.clearLayers();

    activeVehicles.forEach((bus) => {
      const isHighlighted = highlightedVehicleId === bus.vehicleId;

      // Color coding by crowdedness
      const loadColor =
        bus.load === 'SEA'
          ? 'bg-emerald-600'
          : bus.load === 'SDA'
          ? 'bg-amber-500'
          : 'bg-rose-600';

      const html = `
        <div class="relative flex items-center justify-center ${isHighlighted ? 'scale-125 z-30' : 'z-20'} transition-transform">
          <div class="flex items-center gap-1 px-1.5 py-0.5 rounded-md ${loadColor} text-white font-bold text-xs shadow-md border border-white cursor-pointer hover:shadow-lg">
            <span style="display:inline-block; transform: rotate(${bus.bearing}deg); font-size: 10px;">▲</span>
            <span>${bus.serviceNo}</span>
            <span class="text-[9px] opacity-90">${bus.type}</span>
          </div>
        </div>
      `;

      const icon = L.divIcon({
        className: 'custom-bus-marker',
        html,
        iconSize: [44, 28],
        iconAnchor: [22, 14],
      });

      const marker = L.marker([bus.latitude, bus.longitude], { icon });

      const loadLabel =
        bus.load === 'SEA'
          ? 'Seats Available'
          : bus.load === 'SDA'
          ? 'Standing Available'
          : 'Limited Standing';

      const popupContent = `
        <div class="p-3 text-slate-800 text-xs min-w-[200px]">
          <div class="flex items-center justify-between pb-1.5 border-b border-slate-200">
            <div class="flex items-center gap-1.5 font-bold text-sm">
              <span class="px-1.5 py-0.5 rounded bg-emerald-600 text-white">${bus.serviceNo}</span>
              <span>${bus.plateNumber}</span>
            </div>
            <span class="text-[11px] text-slate-500 font-mono">${bus.operator}</span>
          </div>
          <div class="mt-2 space-y-1">
            <div class="flex justify-between">
              <span class="text-slate-500">Destination:</span>
              <span class="font-medium">${bus.destinationName}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500">Speed:</span>
              <span class="font-mono">${bus.speed} km/h</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500">Deck:</span>
              <span class="font-medium">${bus.type === 'DD' ? 'Double Deck' : bus.type === 'BD' ? 'Bendy' : 'Single Deck'}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-slate-500">Occupancy:</span>
              <span class="font-semibold ${bus.load === 'SEA' ? 'text-emerald-600' : bus.load === 'SDA' ? 'text-amber-600' : 'text-rose-600'}">
                ${loadLabel}
              </span>
            </div>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.on('click', () => {
        if (onSelectVehicle) onSelectVehicle(bus);
      });

      busMarkersLayerRef.current?.addLayer(marker);
    });
  }, [activeVehicles, highlightedVehicleId, onSelectVehicle]);

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm bg-slate-100 dark:bg-slate-900">
      <div ref={mapContainerRef} className="w-full h-full z-10" />

      {/* Floating Map Legend & Recenter Pill */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
        <button
          onClick={() => {
            if (mapInstanceRef.current) {
              mapInstanceRef.current.flyTo([activeStop.latitude, activeStop.longitude], 16);
            }
          }}
          className="px-3 py-1.5 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:text-emerald-600 transition-colors flex items-center gap-1.5"
        >
          <span>Center Stop</span>
          <span className="font-mono text-[10px] text-slate-400">({activeStop.busStopCode})</span>
        </button>

        <button
          onClick={() => {
            if (mapInstanceRef.current) {
              mapInstanceRef.current.flyTo([1.3521, 103.8198], 12);
            }
          }}
          className="px-3 py-1.5 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:text-emerald-600 transition-colors"
        >
          View Singapore
        </button>
      </div>

      {/* Bottom map info bar */}
      <div className="absolute bottom-4 left-4 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm text-xs flex items-center gap-3 text-slate-600 dark:text-slate-300">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
          <span>Seats</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          <span>Standing</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
          <span>Limited</span>
        </div>
        <span className="text-slate-300 dark:text-slate-700">|</span>
        <span className="font-mono">{activeVehicles.length} buses live</span>
      </div>
    </div>
  );
};
