import React from 'react';
import { X, Layers, Accessibility, Users, Info } from 'lucide-react';
import { OPERATOR_METADATA } from '../data/singaporeBuses';

interface LegendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LegendModal: React.FC<LegendModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Singapore LTA Indicators & Legend</h3>
              <p className="text-xs text-slate-500">Official Land Transport Authority standards</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs text-slate-600 dark:text-slate-300">
          {/* Crowdedness */}
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white text-sm mb-2.5 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-600" />
              <span>Bus Occupancy & Crowdedness</span>
            </h4>
            <div className="space-y-2">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
                  <div>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">Seats Available (SEA)</span>
                    <p className="text-[11px] text-slate-500">Plenty of seats vacant. Commuters are guaranteed seating.</p>
                  </div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-amber-500 shrink-0" />
                  <div>
                    <span className="font-bold text-amber-700 dark:text-amber-400">Standing Available (SDA)</span>
                    <p className="text-[11px] text-slate-500">All seats taken, but ample comfortable standing room exists.</p>
                  </div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500 shrink-0" />
                  <div>
                    <span className="font-bold text-rose-700 dark:text-rose-400">Limited Standing (LSD)</span>
                    <p className="text-[11px] text-slate-500">High crowd density. Boarding may be restricted or tight.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Vehicle Types */}
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white text-sm mb-2.5 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>Bus Fleet Types</span>
            </h4>
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
                <div className="font-mono font-bold text-slate-800 dark:text-slate-200">SD</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Single Deck</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
                <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400">DD</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Double Deck (2 tiers)</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
                <div className="font-mono font-bold text-purple-600 dark:text-purple-400">BD</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Bendy / Articulated</div>
              </div>
            </div>
          </div>

          {/* Accessibility */}
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white text-sm mb-2 flex items-center gap-1.5">
              <Accessibility className="w-4 h-4 text-sky-600" />
              <span>Accessibility & Low-Floor Ramp</span>
            </h4>
            <p className="text-slate-500 leading-relaxed">
              <strong>WAB (Wheelchair Accessible Bus):</strong> Equipped with automatic or driver-deployed folding ramps and dedicated wheelchair bays with safety restraints.
            </p>
          </div>

          {/* Operators */}
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white text-sm mb-2">
              Public Transport Operators (PTOs)
            </h4>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              {Object.entries(OPERATOR_METADATA).map(([key, op]) => (
                <div
                  key={key}
                  className={`p-2 rounded-xl border flex items-center justify-between ${op.bg} ${op.border}`}
                >
                  <span className={`font-semibold ${op.color}`}>{op.name}</span>
                  <span className="font-mono text-slate-400">{key}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 dark:bg-slate-700 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors text-xs"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
