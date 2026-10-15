import React, { useState } from 'react';
import { BusStop } from '../types/bus';
import { Search, Locate, X, Train, ChevronRight } from 'lucide-react';
import { searchBusStops, findNearestBusStops } from '../services/busService';

interface StopSelectorProps {
  activeStop: BusStop;
  onSelectStop: (stop: BusStop) => void;
  onSelectRegion?: (region: string) => void;
}

const REGION_SHORTCUTS = [
  'All',
  'Bugis',
  'Orchard',
  'Marina Bay',
  'Jurong East',
  'Tampines',
  'Bishan',
  'Woodlands',
];

export const StopSelector: React.FC<StopSelectorProps> = ({
  activeStop,
  onSelectStop,
}) => {
  const [query, setQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('All');
  const [isLocating, setIsLocating] = useState(false);
  const [locationMessage, setLocationMessage] = useState<string | null>(null);

  const filteredStops = searchBusStops(query).filter((stop) => {
    if (selectedRegion === 'All') return true;
    return (
      (stop.zone && stop.zone.toLowerCase().includes(selectedRegion.toLowerCase())) ||
      stop.description.toLowerCase().includes(selectedRegion.toLowerCase())
    );
  });

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setLocationMessage('Geolocation is not supported by your browser');
      setTimeout(() => setLocationMessage(null), 3500);
      return;
    }

    setIsLocating(true);
    setLocationMessage('Finding nearest Singapore bus stop...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const { latitude, longitude } = position.coords;
        const nearest = findNearestBusStops(latitude, longitude, 1);
        if (nearest.length > 0) {
          onSelectStop(nearest[0]);
          setLocationMessage(`Found nearest: ${nearest[0].description} (${nearest[0].distanceMeters}m away)`);
          setTimeout(() => setLocationMessage(null), 4000);
        }
      },
      (err) => {
        setIsLocating(false);
        // Fallback for desktop simulation: pick Orchard Road / Dhoby Ghaut
        const orchardStop = searchBusStops('03011')[0];
        if (orchardStop) {
          onSelectStop(orchardStop);
          setLocationMessage('Location permission bypassed: Defaulted to Dhoby Ghaut / Orchard hub');
          setTimeout(() => setLocationMessage(null), 4000);
        }
      },
      { timeout: 7000 }
    );
  };

  return (
    <div className="space-y-3">
      {/* Search Input Bar + Locate Button */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search 5-digit code, road, MRT, or bus no. (e.g. 01012, Bugis, 65)..."
            className="w-full pl-10 pr-9 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 dark:text-white placeholder:text-slate-400 shadow-sm"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <button
          onClick={handleLocateMe}
          disabled={isLocating}
          title="Find nearest Singapore bus stop"
          className="h-10 px-3.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium flex items-center gap-1.5 shadow-sm transition-colors whitespace-nowrap shrink-0"
        >
          <Locate className={`w-4 h-4 text-emerald-600 ${isLocating ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Near Me</span>
        </button>
      </div>

      {locationMessage && (
        <div className="text-xs px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-lg border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
          <span>{locationMessage}</span>
          <button onClick={() => setLocationMessage(null)} className="text-emerald-600 hover:text-emerald-800 ml-2">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Region Filter Buttons */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {REGION_SHORTCUTS.map((reg) => (
          <button
            key={reg}
            onClick={() => setSelectedRegion(reg)}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              selectedRegion === reg
                ? 'bg-slate-900 text-white dark:bg-emerald-600'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {reg}
          </button>
        ))}
      </div>

      {/* Stop selection list if search active or user browsing */}
      {query.length > 0 && (
        <div className="max-h-56 overflow-y-auto space-y-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1 shadow-lg">
          {filteredStops.length === 0 ? (
            <div className="p-3 text-center text-xs text-slate-500">
              No bus stops found matching "{query}". Try 01012, Bugis, or 65.
            </div>
          ) : (
            filteredStops.slice(0, 8).map((stop) => (
              <button
                key={stop.busStopCode}
                onClick={() => {
                  onSelectStop(stop);
                  setQuery('');
                }}
                className={`w-full text-left p-2.5 rounded-lg flex items-center justify-between text-xs transition-colors ${
                  stop.busStopCode === activeStop.busStopCode
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-medium'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {stop.busStopCode}
                    </span>
                    <span>{stop.description}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                    <span>{stop.roadName}</span>
                    {stop.mrtProximity && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="flex items-center gap-0.5 text-slate-600 dark:text-slate-400">
                          <Train className="w-3 h-3 text-emerald-600" />
                          <span>{stop.mrtProximity}</span>
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-slate-400">
                  <span className="font-mono text-[11px]">{stop.services.length} svcs</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};
