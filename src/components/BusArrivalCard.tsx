import React, { useState } from 'react';
import { BusServiceArrival, BusArrivalEstimate, BusLoad, BusType } from '../types/bus';
import { OPERATOR_METADATA } from '../data/singaporeBuses';
import { Layers, Accessibility, Bell, MapPin, ChevronDown, ChevronUp, Navigation, Gauge } from 'lucide-react';

interface BusArrivalCardProps {
  arrival: BusServiceArrival;
  onTrackOnMap: (serviceNo: string, vehicleId?: string) => void;
  onViewRoute: (serviceNo: string) => void;
  onSetAlert?: (serviceNo: string, minutes: number) => void;
  isFavoriteService?: boolean;
}

export const BusArrivalCard: React.FC<BusArrivalCardProps> = ({
  arrival,
  onTrackOnMap,
  onViewRoute,
  onSetAlert,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [alertSet, setAlertSet] = useState(false);

  const operatorInfo = OPERATOR_METADATA[arrival.operator] || OPERATOR_METADATA.SBST;

  const formatWaitTime = (estimate: BusArrivalEstimate | null) => {
    if (!estimate) return { text: '—', isArr: false, sub: 'No data' };
    const sec = estimate.secondsRemaining ?? 0;
    if (sec <= 45) {
      return { text: 'Arr', isArr: true, sub: 'Arriving now' };
    }
    const mins = Math.ceil(sec / 60);
    return { text: `${mins}m`, isArr: false, sub: `${mins} min away` };
  };

  const getLoadBadge = (load: BusLoad) => {
    switch (load) {
      case 'SEA':
        return {
          label: 'Seats',
          textColor: 'text-emerald-700 dark:text-emerald-400',
          bgColor: 'bg-emerald-50 dark:bg-emerald-950/40',
          indicator: 'bg-emerald-500',
        };
      case 'SDA':
        return {
          label: 'Standing',
          textColor: 'text-amber-700 dark:text-amber-400',
          bgColor: 'bg-amber-50 dark:bg-amber-950/40',
          indicator: 'bg-amber-500',
        };
      case 'LSD':
        return {
          label: 'Full',
          textColor: 'text-rose-700 dark:text-rose-400',
          bgColor: 'bg-rose-50 dark:bg-rose-950/40',
          indicator: 'bg-rose-500',
        };
    }
  };

  const getDeckIcon = (type: BusType) => {
    if (type === 'DD') {
      return (
        <span title="Double Decker Bus" className="flex items-center gap-0.5 text-[10px] text-slate-500 font-mono">
          <Layers className="w-3 h-3 text-emerald-600" />
          <span>DD</span>
        </span>
      );
    }
    if (type === 'BD') {
      return (
        <span title="Bendy / Articulated Bus" className="flex items-center gap-0.5 text-[10px] text-purple-600 font-mono font-medium">
          <span>⇄ BD</span>
        </span>
      );
    }
    return (
      <span title="Single Deck Bus" className="text-[10px] text-slate-400 font-mono">
        SD
      </span>
    );
  };

  const next1 = formatWaitTime(arrival.nextBus);
  const next2 = formatWaitTime(arrival.nextBus2);
  const next3 = formatWaitTime(arrival.nextBus3);

  const handleToggleAlert = () => {
    setAlertSet(!alertSet);
    if (!alertSet && onSetAlert) {
      onSetAlert(arrival.serviceNo, 2);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 transition-all hover:border-slate-300 dark:hover:border-slate-700 shadow-sm">
      {/* Top Row: Service Number, Operator & Destination */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-14 h-12 bg-slate-900 dark:bg-emerald-600 text-white font-extrabold text-xl rounded-xl flex items-center justify-center tracking-tight shadow-sm">
            {arrival.serviceNo}
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className={`font-medium ${operatorInfo.color}`}>{operatorInfo.name}</span>
              <span aria-hidden="true">·</span>
              <span>to {arrival.destinationName}</span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
              <span>Next 3 departures</span>
              {arrival.nextBus?.feature === 'WAB' && (
                <span title="Wheelchair Accessible Bus" className="inline-flex items-center text-slate-500">
                  <Accessibility className="w-3 h-3 text-sky-600" />
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleToggleAlert}
            title={alertSet ? 'Alert active for this bus' : 'Notify me 2m before arrival'}
            className={`p-2 rounded-lg transition-colors ${
              alertSet
                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600'
                : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Bell className="w-4 h-4" />
          </button>
          <button
            onClick={() => onTrackOnMap(arrival.serviceNo, `${arrival.serviceNo}-1`)}
            title="Locate live bus on map"
            className="p-2 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Navigation className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            title="Expand vehicle details"
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Middle Row: 3-tier Arrival Predictions Grid */}
      <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
        {/* Next Bus 1 */}
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span className="font-semibold text-slate-700 dark:text-slate-300">1st Bus</span>
            {arrival.nextBus && getDeckIcon(arrival.nextBus.type)}
          </div>
          <div className="my-1">
            <span
              className={`text-xl font-bold tracking-tight font-mono tabular-nums ${
                next1.isArr ? 'text-emerald-600 dark:text-emerald-400 animate-pulse' : 'text-slate-900 dark:text-white'
              }`}
            >
              {next1.text}
            </span>
          </div>
          {arrival.nextBus && (
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className={`w-2 h-2 rounded-full ${getLoadBadge(arrival.nextBus.load).indicator}`} />
              <span className={getLoadBadge(arrival.nextBus.load).textColor}>
                {getLoadBadge(arrival.nextBus.load).label}
              </span>
            </div>
          )}
        </div>

        {/* Next Bus 2 */}
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span className="font-medium">2nd Bus</span>
            {arrival.nextBus2 && getDeckIcon(arrival.nextBus2.type)}
          </div>
          <div className="my-1">
            <span className="text-xl font-bold tracking-tight font-mono tabular-nums text-slate-900 dark:text-white">
              {next2.text}
            </span>
          </div>
          {arrival.nextBus2 && (
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className={`w-2 h-2 rounded-full ${getLoadBadge(arrival.nextBus2.load).indicator}`} />
              <span className={getLoadBadge(arrival.nextBus2.load).textColor}>
                {getLoadBadge(arrival.nextBus2.load).label}
              </span>
            </div>
          )}
        </div>

        {/* Next Bus 3 */}
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span className="font-medium">3rd Bus</span>
            {arrival.nextBus3 && getDeckIcon(arrival.nextBus3.type)}
          </div>
          <div className="my-1">
            <span className="text-xl font-bold tracking-tight font-mono tabular-nums text-slate-900 dark:text-white">
              {next3.text}
            </span>
          </div>
          {arrival.nextBus3 && (
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className={`w-2 h-2 rounded-full ${getLoadBadge(arrival.nextBus3.load).indicator}`} />
              <span className={getLoadBadge(arrival.nextBus3.load).textColor}>
                {getLoadBadge(arrival.nextBus3.load).label}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Expanded Telemetry & Action Drawer */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
          {arrival.nextBus && (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> Approaching Vehicle
                </span>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                  {arrival.nextBus.vehiclePlate || 'SG Bus'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1">
                  <Gauge className="w-3.5 h-3.5" /> Real-Time Telemetry
                </span>
                <span className="font-mono text-slate-700 dark:text-slate-300">
                  {arrival.nextBus.speed} km/h · {arrival.nextBus.distanceMeters ?? 450}m away
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Live GPS Coordinate:</span>
                <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400">
                  {arrival.nextBus.latitude.toFixed(4)}, {arrival.nextBus.longitude.toFixed(4)}
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={() => onViewRoute(arrival.serviceNo)}
              className="flex-1 py-2 px-3 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              <span>View Route Stops</span>
            </button>
            <button
              onClick={() => onTrackOnMap(arrival.serviceNo, `${arrival.serviceNo}-1`)}
              className="flex-1 py-2 px-3 text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Track Live Vehicle</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
