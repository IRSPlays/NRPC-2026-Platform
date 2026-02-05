import React from 'react';
import { AlertTriangle, CheckCircle2, Activity } from 'lucide-react';

interface MissionCardProps {
  number: number;
  title: string;
  maxPoints: number;
  currentPoints: number;
  warning?: string;
  isCritical?: boolean;
  isComplete?: boolean;
  children: React.ReactNode;
}

const MissionCard: React.FC<MissionCardProps> = ({
  number,
  title,
  maxPoints,
  currentPoints,
  warning,
  isCritical = false,
  isComplete = false,
  children,
}) => {
  const progressPercentage = (currentPoints / maxPoints) * 100;

  return (
    <div className={`neo-glass rounded-3xl border-2 transition-all duration-300 relative overflow-hidden group ${
      isCritical && currentPoints === 0 && warning 
        ? 'border-neo-amber/50 shadow-[0_0_30px_rgba(255,179,0,0.1)]' 
        : isComplete 
          ? 'border-neo-cyan/40 shadow-[0_0_30px_rgba(102,252,241,0.1)]'
          : 'border-white/5 hover:border-neo-cyan/30'
    }`}>
      {/* Decorative Module ID */}
      <div className="absolute top-4 right-6 text-[10px] font-mono text-white/10 tracking-[0.5em] select-none uppercase">
        MOD-00{number} // SEC-ALPHA
      </div>

      {/* Header */}
      <div className="px-8 py-6 flex items-center justify-between">
        <div className="flex items-center gap-5">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black font-mono transition-colors ${
            isCritical
              ? 'bg-neo-amber/10 text-neo-amber border border-neo-amber/20'
              : isComplete
                ? 'bg-neo-cyan text-neo-void shadow-[0_0_15px_rgba(102,252,241,0.5)]'
                : 'bg-white/5 text-neo-slate/40 border border-white/10'
          }`}>
            0{number}
          </div>
          <div>
            <h3 className="text-xl font-heading font-bold text-white uppercase tracking-tight flex items-center gap-2">
              {title}
              {isComplete && <Activity className="w-4 h-4 text-neo-cyan animate-pulse" />}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-[10px] font-mono uppercase tracking-widest ${
                isCritical ? 'text-neo-amber' : 'text-neo-cyan/60'
              }`}>
                {isCritical ? 'Critical Priority' : 'Standard Mission'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <div className={`text-3xl font-black font-mono tracking-tighter ${
            isCritical && currentPoints === 0 && warning ? 'text-neo-amber' : 'text-neo-cyan'
          }`}>
            {currentPoints.toString().padStart(2, '0')}
            <span className="text-sm text-neo-slate/30 font-normal ml-1">/ {maxPoints}</span>
          </div>
        </div>
      </div>

      {/* Progress Bar (Technical Style) */}
      <div className="px-8 mb-6">
        <div className="h-1 bg-white/5 rounded-full overflow-hidden flex gap-1">
          <div 
            className={`h-full transition-all duration-700 ease-out rounded-full ${
              isCritical && currentPoints === 0
                ? 'bg-neo-amber shadow-[0_0_10px_rgba(255,179,0,0.5)]'
                : 'bg-neo-cyan shadow-[0_0_10px_rgba(102,252,241,0.5)]'
            }`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Content Area */}
      <div className="px-8 pb-8 pt-2">
        {children}
      </div>

      {/* Footer Alerts */}
      {(warning || isComplete) && (
        <div className={`px-8 py-4 border-t flex items-center gap-3 ${
          isCritical && currentPoints === 0
            ? 'bg-neo-amber/5 border-neo-amber/10'
            : isComplete
              ? 'bg-neo-cyan/5 border-neo-cyan/10'
              : 'bg-white/5 border-white/5'
        }`}>
          {isComplete && !warning ? (
            <CheckCircle2 className="w-4 h-4 text-neo-cyan" />
          ) : (
            <AlertTriangle className={`w-4 h-4 ${isCritical ? 'text-neo-amber' : 'text-neo-cyan'}`} />
          )}
          <span className={`text-xs font-mono uppercase tracking-wider ${
            isCritical && currentPoints === 0 ? 'text-neo-amber' : isComplete ? 'text-neo-cyan' : 'text-neo-slate/60'
          }`}>
            {warning ? warning : 'Sub-system Synchronized'}
          </span>
        </div>
      )}
    </div>
  );
};

export default MissionCard;
