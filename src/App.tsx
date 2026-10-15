import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  BusStop,
  BusServiceArrival,
  ActiveBusVehicle,
  BusRouteInfo,
  BackendConfig,
} from './types/bus';
import { SINGAPORE_BUS_STOPS, BUS_ROUTES } from './data/singaporeBuses';
import {
  fetchBusArrivals,
  getActiveFleetBuses,
  getStoredBackendConfig,
  saveBackendConfig,
  getStoredFavorites,
  toggleFavoriteStop,
} from './services/busService';
import { Header } from './components/Header';
import { BusArrivalCard } from './components/BusArrivalCard';
import { BusMap } from './components/BusMap';
import { StopSelector } from './components/StopSelector';
import { RouteProgressModal } from './components/RouteProgressModal';
import { BackendConfigModal } from './components/BackendConfigModal';
import { LegendModal } from './components/LegendModal';
import {
  MapPin,
  Bookmark,
  Train,
  SlidersHorizontal,
  Compass,
  BellRing,
  RefreshCw,
  Search,
  ExternalLink,
  Layers,
  ArrowRight,
  Share2,
} from 'lucide-react';

export default function App() {
  // App state
  const [activeStop, setActiveStop] = useState<BusStop>(SINGAPORE_BUS_STOPS[0]); // Bugis default
  const [arrivals, setArrivals] = useState<BusServiceArrival[]>([]);
  const [activeVehicles, setActiveVehicles] = useState<ActiveBusVehicle[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [backendConfig, setBackendConfig] = useState<BackendConfig>(getStoredBackendConfig());

  // Views & modals
  const [activeView, setActiveView] = useState<'board' | 'map' | 'routes' | 'favorites'>('board');
  const [selectedServiceRoute, setSelectedServiceRoute] = useState<BusRouteInfo | null>(null);
  const [highlightedVehicleId, setHighlightedVehicleId] = useState<string | null>(null);
  const [isBackendModalOpen, setIsBackendModalOpen] = useState(false);
  const [isLegendModalOpen, setIsLegendModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters within active stop
  const [serviceSearch, setServiceSearch] = useState('');
  const [activeDeckFilter, setActiveDeckFilter] = useState<'ALL' | 'DD' | 'SD'>('ALL');
  const [alertNotice, setAlertNotice] = useState<string | null>(null);

  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load initial favorites & backend config
  useEffect(() => {
    setFavorites(getStoredFavorites());
  }, []);

  // Fetch arrivals when active stop changes or refreshed
  const loadArrivals = async (stop: BusStop) => {
    setIsRefreshing(true);
    try {
      const res = await fetchBusArrivals(stop.busStopCode, backendConfig);
      setArrivals(res.arrivals);
      const fleet = getActiveFleetBuses(stop, res.arrivals);
      setActiveVehicles(fleet);
    } catch (e) {
      console.error('Error loading arrivals', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadArrivals(activeStop);

    // Setup periodic auto-refresh
    if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    refreshTimerRef.current = setInterval(() => {
      loadArrivals(activeStop);
    }, backendConfig.autoRefreshIntervalSeconds * 1000);

    return () => {
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    };
  }, [activeStop.busStopCode, backendConfig.autoRefreshIntervalSeconds, backendConfig.useMockSimulation]);

  // Live 1-second ticker to smoothly decrement countdowns & move fleet buses
  useEffect(() => {
    const secondTicker = setInterval(() => {
      setArrivals((prev) =>
        prev.map((svc) => {
          const dec = (est: any) => {
            if (!est) return null;
            const nextSec = Math.max(0, (est.secondsRemaining ?? 60) - 1);
            return {
              ...est,
              secondsRemaining: nextSec,
            };
          };

          return {
            ...svc,
            nextBus: dec(svc.nextBus),
            nextBus2: dec(svc.nextBus2),
            nextBus3: dec(svc.nextBus3),
          };
        })
      );

      // Smooth micro-motion for buses on the map
      setActiveVehicles((prev) =>
        prev.map((v) => {
          const deltaLat = (Math.cos((v.bearing * Math.PI) / 180) * (v.speed / 3600)) / 111000;
          const deltaLng = (Math.sin((v.bearing * Math.PI) / 180) * (v.speed / 3600)) / 111000;
          return {
            ...v,
            latitude: Number((v.latitude + deltaLat).toFixed(5)),
            longitude: Number((v.longitude + deltaLng).toFixed(5)),
          };
        })
      );
    }, 1000);

    return () => clearInterval(secondTicker);
  }, []);

  // Filtered arrival list
  const filteredArrivals = useMemo(() => {
    return arrivals.filter((item) => {
      if (serviceSearch && !item.serviceNo.toLowerCase().includes(serviceSearch.toLowerCase())) {
        return false;
      }
      if (activeDeckFilter === 'DD' && item.nextBus?.type !== 'DD') {
        return false;
      }
      if (activeDeckFilter === 'SD' && item.nextBus?.type !== 'SD') {
        return false;
      }
      return true;
    });
  }, [arrivals, serviceSearch, activeDeckFilter]);

  const isFavorite = favorites.includes(activeStop.busStopCode);

  const handleToggleFavorite = () => {
    const next = toggleFavoriteStop(activeStop.busStopCode);
    setFavorites(next);
  };

  const handleTrackOnMap = (serviceNo: string, vehicleId?: string) => {
    if (vehicleId) setHighlightedVehicleId(vehicleId);
    const route = BUS_ROUTES[serviceNo];
    if (route) setSelectedServiceRoute(route);
    setActiveView('map');
  };

  const handleViewRoute = (serviceNo: string) => {
    const route = BUS_ROUTES[serviceNo];
    if (route) {
      setSelectedServiceRoute(route);
    } else {
      // Create synthetic route for display
      setSelectedServiceRoute({
        serviceNo,
        operator: 'SBST',
        originCode: activeStop.busStopCode,
        originName: activeStop.description,
        destinationCode: '99999',
        destinationName: 'Terminus Hub',
        firstBus: '05:30',
        lastBus: '23:45',
        headwayPeak: '6 - 9 mins',
        headwayOffPeak: '10 - 14 mins',
        stops: [
          {
            busStopCode: activeStop.busStopCode,
            description: activeStop.description,
            roadName: activeStop.roadName,
            stopSequence: 1,
            distanceKm: 0,
            latitude: activeStop.latitude,
            longitude: activeStop.longitude,
          },
          ...SINGAPORE_BUS_STOPS.slice(1, 6).map((s, idx) => ({
            busStopCode: s.busStopCode,
            description: s.description,
            roadName: s.roadName,
            stopSequence: idx + 2,
            distanceKm: (idx + 1) * 3.2,
            latitude: s.latitude,
            longitude: s.longitude,
          })),
        ],
      });
    }
  };

  const handleSetAlert = (serviceNo: string, minutes: number) => {
    setAlertNotice(`Alert activated: We will notify you when Bus ${serviceNo} is ${minutes} mins away.`);
    setTimeout(() => setAlertNotice(null), 5000);
  };

  const handleSaveBackendConfig = (newConfig: BackendConfig) => {
    setBackendConfig(newConfig);
    saveBackendConfig(newConfig);
    loadArrivals(activeStop);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        activeView={activeView}
        onSelectView={setActiveView}
        onOpenBackendConfig={() => setIsBackendModalOpen(true)}
        onOpenLegend={() => setIsLegendModalOpen(true)}
        onRefresh={() => loadArrivals(activeStop)}
        isRefreshing={isRefreshing}
        favoritesCount={favorites.length}
      />

      {/* Alert banner if active */}
      {alertNotice && (
        <div className="bg-emerald-600 text-white text-xs py-2 px-4 text-center font-medium shadow-sm flex items-center justify-center gap-2">
          <BellRing className="w-4 h-4 animate-bounce" />
          <span>{alertNotice}</span>
          <button onClick={() => setAlertNotice(null)} className="ml-3 underline hover:opacity-80">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        {/* Top Control Bar: Stop Information & Quick Actions */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            {/* Bus Stop Identity */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-extrabold px-2 py-0.5 rounded-md bg-emerald-600 text-white">
                  {activeStop.busStopCode}
                </span>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {activeStop.description}
                </h1>
                <button
                  onClick={handleToggleFavorite}
                  title={isFavorite ? 'Remove from saved stops' : 'Save this stop'}
                  className={`p-1.5 rounded-lg transition-colors ${
                    isFavorite
                      ? 'text-amber-500 hover:text-amber-600 bg-amber-50 dark:bg-amber-950/40'
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Bookmark className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                </button>
              </div>

              {/* Quiet unboxed metadata */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{activeStop.roadName}</span>
                </span>
                {activeStop.zone && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>{activeStop.zone}</span>
                  </>
                )}
                {activeStop.mrtProximity && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium">
                      <Train className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{activeStop.mrtProximity}</span>
                    </span>
                  </>
                )}
                <span aria-hidden="true">·</span>
                <span className="font-mono">{arrivals.length} services</span>
              </div>
            </div>

            {/* Quick Switcher / Search Trigger */}
            <div className="w-full lg:w-96">
              <StopSelector activeStop={activeStop} onSelectStop={setActiveStop} />
            </div>
          </div>
        </section>

        {/* View Switcher Tabs (For mobile & quick toggling) */}
        <div className="flex lg:hidden items-center p-1 bg-slate-200 dark:bg-slate-800 rounded-xl">
          <button
            onClick={() => setActiveView('board')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeView === 'board'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Arrival Times ({filteredArrivals.length})
          </button>
          <button
            onClick={() => setActiveView('map')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeView === 'map'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Live Map ({activeVehicles.length} buses)
          </button>
        </div>

        {/* Main Content Layout */}
        {activeView === 'favorites' ? (
          /* Favorites View */
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Your Saved Bus Stops</h2>
                <p className="text-xs text-slate-500">Quickly check arrival times for your daily commute</p>
              </div>
              <button
                onClick={() => setActiveView('board')}
                className="text-xs font-medium text-emerald-600 hover:text-emerald-700"
              >
                Back to Board
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {favorites.map((code) => {
                const stop = SINGAPORE_BUS_STOPS.find((s) => s.busStopCode === code);
                if (!stop) return null;

                return (
                  <div
                    key={code}
                    onClick={() => {
                      setActiveStop(stop);
                      setActiveView('board');
                    }}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-500 cursor-pointer shadow-sm transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-emerald-600">{stop.busStopCode}</span>
                      <span className="text-[11px] text-slate-400">{stop.services.length} services</span>
                    </div>
                    <div className="font-bold text-slate-900 dark:text-white mt-1 text-sm">{stop.description}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{stop.roadName}</div>
                    <div className="mt-3 flex items-center justify-between text-xs text-emerald-600 font-medium">
                      <span>View live arrivals</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ) : activeView === 'routes' ? (
          /* Routes Catalog View */
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Singapore Bus Route Directory</h2>
                <p className="text-xs text-slate-500">Explore complete stop sequences and operating timetables</p>
              </div>
              <button
                onClick={() => setActiveView('board')}
                className="text-xs font-medium text-emerald-600 hover:text-emerald-700"
              >
                Back to Board
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.values(BUS_ROUTES).map((route) => (
                <div
                  key={route.serviceNo}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-500 shadow-sm transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-emerald-600 text-white font-extrabold text-base flex items-center justify-center">
                        {route.serviceNo}
                      </div>
                      <span className="text-xs font-mono text-slate-500">{route.operator}</span>
                    </div>
                    <div className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">
                      {route.originName} → {route.destinationName}
                    </div>
                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                      <span>{route.stops.length} major stops</span>
                      <span aria-hidden="true">·</span>
                      <span>Peak {route.headwayPeak}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <button
                      onClick={() => setSelectedServiceRoute(route)}
                      className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                    >
                      <span>Explore Timeline</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleTrackOnMap(route.serviceNo)}
                      className="px-2.5 py-1 text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors"
                    >
                      View on Map
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : (
          /* Dual-Pane Layout: Arrivals List + Live Fleet Map */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch flex-1">
            {/* Left Pane: Arrivals Board */}
            <div
              className={`lg:col-span-6 xl:col-span-5 space-y-4 ${
                activeView === 'map' ? 'hidden lg:block' : 'block'
              }`}
            >
              {/* Filter controls */}
              <div className="flex items-center justify-between gap-3">
                {/* Search bus service */}
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={serviceSearch}
                    onChange={(e) => setServiceSearch(e.target.value)}
                    placeholder="Filter bus number (e.g. 65, 190)..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-900 dark:text-white"
                  />
                </div>

                {/* Deck filter buttons */}
                <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-xl">
                  <button
                    onClick={() => setActiveDeckFilter('ALL')}
                    className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                      activeDeckFilter === 'ALL'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setActiveDeckFilter('DD')}
                    className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                      activeDeckFilter === 'DD'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Double Deck
                  </button>
                  <button
                    onClick={() => setActiveDeckFilter('SD')}
                    className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                      activeDeckFilter === 'SD'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Single
                  </button>
                </div>
              </div>

              {/* Arrival Cards List */}
              <div className="space-y-3">
                {filteredArrivals.length === 0 ? (
                  <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                      No bus services found matching "{serviceSearch}"
                    </p>
                    <button
                      onClick={() => setServiceSearch('')}
                      className="mt-2 text-xs text-emerald-600 hover:underline"
                    >
                      Clear filter
                    </button>
                  </div>
                ) : (
                  filteredArrivals.map((arrival) => (
                    <BusArrivalCard
                      key={arrival.serviceNo}
                      arrival={arrival}
                      onTrackOnMap={handleTrackOnMap}
                      onViewRoute={handleViewRoute}
                      onSetAlert={handleSetAlert}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Right Pane: Live Fleet Map */}
            <div
              className={`lg:col-span-6 xl:col-span-7 h-[500px] lg:h-auto min-h-[500px] flex flex-col ${
                activeView === 'board' ? 'hidden lg:flex' : 'flex'
              }`}
            >
              <BusMap
                activeStop={activeStop}
                onSelectStop={setActiveStop}
                activeVehicles={activeVehicles}
                selectedServiceRoute={selectedServiceRoute}
                highlightedVehicleId={highlightedVehicleId}
              />
            </div>
          </div>
        )}
      </main>

      {/* Modals & Drawers */}
      <RouteProgressModal
        route={selectedServiceRoute}
        onClose={() => setSelectedServiceRoute(null)}
        onSelectStopCode={setActiveStop}
        activeStopCode={activeStop.busStopCode}
      />

      <BackendConfigModal
        config={backendConfig}
        isOpen={isBackendModalOpen}
        onClose={() => setIsBackendModalOpen(false)}
        onSaveConfig={handleSaveBackendConfig}
        activeStopCode={activeStop.busStopCode}
      />

      <LegendModal isOpen={isLegendModalOpen} onClose={() => setIsLegendModalOpen(false)} />
    </div>
  );
}
