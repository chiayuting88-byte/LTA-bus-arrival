import React from 'react';
import { BusRouteInfo, BusStop } from '../types/bus';
import { X, Clock, ArrowRight, MapPin, Navigation } from 'lucide-react';
import { SINGAPORE_BUS_STOPS } from '../data/singaporeBuses';

interface RouteProgressModalProps {
  route: BusRouteInfo | null;
  onClose: () => void;
  onSelectStopCode: (stop: BusStop) => void;
  activeStopCode: string;
}

export const RouteProgressModal: React.FC<RouteProgressModalProps> = ({
  route,
  onClose,
  onSelectStopCode,
  activeStopCode,
}) => {
  if (!route) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center font-extrabold text-2xl shadow-sm">
              {route.serviceNo}
            </div>
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                <span>{route.originName}</span>
                <ArrowRight className="w-4 h-4 text-slate-400" />
                <span>{route.destinationName}</span>
              </div>
              <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                <span>Operator: {route.operator}</span>
                <span aria-hidden="true">·</span>
                <span className="flex items-center gap-1 font-mono">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>{route.firstBus} – {route.lastBus}</span>
                </span>
                <span aria-hidden="true">·</span>
                <span>Peak: {route.headwayPeak}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Route Stops Timeline */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Route Stops ({route.stops.length} major stations)
          </div>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
            {route.stops.map((stop, index) => {
              const isCurrent = stop.busStopCode === activeStopCode;
              const fullStop = SINGAPORE_BUS_STOPS.find((s) => s.busStopCode === stop.busStopCode);

              return (
                <div key={stop.busStopCode} className="relative group flex items-start justify-between">
                  {/* Timeline node */}
                  <div
                    className={`absolute -left-6 top-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      isCurrent
                        ? 'bg-emerald-600 border-white dark:border-slate-900 shadow-md ring-4 ring-emerald-500/20'
                        : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    {isCurrent && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>

                  <div>
                    <button
                      onClick={() => {
                        if (fullStop) {
                          onSelectStopCode(fullStop);
                          onClose();
                        }
                      }}
                      className="text-left group-hover:text-emerald-600 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-slate-500 dark:text-slate-400">
                          {stop.busStopCode}
                        </span>
                        <span
                          className={`text-sm font-semibold ${
                            isCurrent ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          {stop.description}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] font-medium px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded-md">
                            Current Viewing Stop
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                        <span>{stop.roadName}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono text-[11px] text-slate-400">{stop.distanceKm.toFixed(1)} km</span>
                      </div>
                    </button>
                  </div>

                  <div className="shrink-0">
                    <button
                      onClick={() => {
                        if (fullStop) {
                          onSelectStopCode(fullStop);
                          onClose();
                        }
                      }}
                      className="px-2.5 py-1 text-xs text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <span>Jump</span>
                      <Navigation className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>Click any bus stop to view its live arrival board</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 dark:bg-slate-700 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
