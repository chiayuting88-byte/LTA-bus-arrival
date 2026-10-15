import React from 'react';
import { Bus, Bookmark, Settings, Info, RefreshCw, Compass } from 'lucide-react';

interface HeaderProps {
  activeView: 'board' | 'map' | 'routes' | 'favorites';
  onSelectView: (view: 'board' | 'map' | 'routes' | 'favorites') => void;
  onOpenBackendConfig: () => void;
  onOpenLegend: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  favoritesCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  onSelectView,
  onOpenBackendConfig,
  onOpenLegend,
  onRefresh,
  isRefreshing,
  favoritesCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
              <Bus className="w-5 h-5" />
            </div>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onSelectView('board');
              }}
              className="text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap"
            >
              SG Bus Arrival
            </a>
          </div>

          {/* Zone 2: 4-5 concise single-line text navigation links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
            <button
              onClick={() => onSelectView('board')}
              className={`hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors whitespace-nowrap shrink-0 ${
                activeView === 'board' ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : ''
              }`}
            >
              Arrival Board
            </button>
            <button
              onClick={() => onSelectView('map')}
              className={`hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors whitespace-nowrap shrink-0 ${
                activeView === 'map' ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : ''
              }`}
            >
              Live Fleet Map
            </button>
            <button
              onClick={() => onSelectView('routes')}
              className={`hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors whitespace-nowrap shrink-0 ${
                activeView === 'routes' ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : ''
              }`}
            >
              Bus Routes
            </button>
            <button
              onClick={() => onSelectView('favorites')}
              className={`hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                activeView === 'favorites' ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : ''
              }`}
            >
              <span>Saved Stops</span>
              {favoritesCount > 0 && (
                <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.2 rounded font-mono">
                  {favoritesCount}
                </span>
              )}
            </button>
            <button
              onClick={onOpenLegend}
              className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 text-slate-500"
            >
              <Info className="w-4 h-4" />
              <span>LTA Codes</span>
            </button>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onRefresh}
              title="Refresh bus timings"
              disabled={isRefreshing}
              className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
            </button>

            <button
              onClick={onOpenBackendConfig}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-white bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-500 rounded-lg transition-colors whitespace-nowrap shadow-sm"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Connect Backend</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
