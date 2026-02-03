import React from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

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
    <div className={`bg-white dark:bg-slate-800 rounded-xl border-2 overflow-hidden transition-all duration-200 ${
      isCritical && currentPoints === 0 && warning 
        ? 'border-red-500 shadow-lg shadow-red-500/10' 
        : isComplete 
          ? 'border-[#0D7377] shadow-lg shadow-[#0D7377]/10'
          : 'border-slate-200 dark:border-slate-700 hover:border-[#0D7377]/50'
    }`}>
      {/* Header */}
      <div className={`px-5 py-4 border-b flex items-center justify-between ${
        isCritical 
          ? 'bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/10 border-red-200 dark:border-red-800'
          : 'bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-750 border-slate-200 dark:border-slate-700'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
            isCritical
              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              : isComplete
                ? 'bg-[#0D7377] text-white'
                : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
          }`}>
            {number}
          </div>
          <div>
            <h3 className={`font-semibold ${
              isCritical ? 'text-red-700 dark:text-red-400' : 'text-slate-900 dark:text-slate-100'
            }`}>
              {title}
            </h3>
            {isCritical && (
              <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                CRITICAL RULE
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-bold font-['Space_Grotesk'] ${
            isCritical && currentPoints === 0 
              ? 'text-red-500' 
              : 'text-[#0D7377]'
          }`}>
            {currentPoints}
            <span className="text-sm text-slate-400 font-normal ml-1">/ {maxPoints}</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1 bg-slate-100 dark:bg-slate-700">
        <div 
          className={`h-full transition-all duration-300 ${
            isCritical && currentPoints === 0
              ? 'bg-red-500'
              : isComplete
                ? 'bg-[#0D7377]'
                : 'bg-[#14FFEC]'
          }`}
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Content */}
      <div className="p-5">
        {children}
      </div>

      {/* Warning */}
      {warning && (
        <div className={`px-5 py-3 border-t flex items-start gap-2 ${
          isCritical && currentPoints === 0
            ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
            : 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800'
        }`}>
          <AlertTriangle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
            isCritical && currentPoints === 0 ? 'text-red-500' : 'text-amber-500'
          }`} />
          <span className={`text-sm ${
            isCritical && currentPoints === 0 
              ? 'text-red-700 dark:text-red-400' 
              : 'text-amber-700 dark:text-amber-400'
          }`}>
            {warning}
          </span>
        </div>
      )}

      {/* Complete indicator */}
      {isComplete && !warning && (
        <div className="px-5 py-2 bg-[#0D7377]/10 border-t border-[#0D7377]/20 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#0D7377]" />
          <span className="text-sm text-[#0D7377] font-medium">Mission Complete!</span>
        </div>
      )}
    </div>
  );
};

export default MissionCard;
