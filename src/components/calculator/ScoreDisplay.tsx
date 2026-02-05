import React, { useEffect, useState } from 'react';
import { Trophy, Clock, AlertCircle, Activity, Zap } from 'lucide-react';

interface ScoreDisplayProps {
  totalScore: number;
  maxScore: number;
  timeSeconds: string;
  onTimeChange: (value: string) => void;
}

const ScoreDisplay: React.FC<ScoreDisplayProps> = ({
  totalScore,
  maxScore,
  timeSeconds,
  onTimeChange,
}) => {
  const [displayScore, setDisplayScore] = useState(totalScore);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (displayScore !== totalScore) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setDisplayScore(totalScore);
        setIsAnimating(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [totalScore, displayScore]);

  const percentage = Math.round((totalScore / maxScore) * 100);
  const circumference = 2 * Math.PI * 80;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="neo-glass rounded-[1.5rem] md:rounded-[2rem] p-4 md:p-8 border-neo-cyan/10 lg:sticky top-24 overflow-hidden">
      {/* Decorative Scanner Line */}
      <div className="scanning-line absolute w-full top-0 left-0 opacity-10"></div>

      <div className="flex items-center justify-between mb-4 md:mb-8">
        <h2 className="text-[10px] font-mono font-bold text-neo-cyan uppercase tracking-[0.2em] md:tracking-[0.3em] flex items-center gap-2">
          <Activity className="w-3 h-3 md:w-4 md:h-4 animate-pulse" />
          Sync Status
        </h2>
        <div className="px-2 py-0.5 rounded border border-neo-cyan/30 text-[8px] md:text-[10px] font-mono text-neo-cyan/60 animate-pulse">
          LIVE
        </div>
      </div>

      {/* Circular Gauge - Technical Re-skin */}
      <div className="relative flex items-center justify-center mb-6 md:mb-10">
        <svg className="w-40 h-40 md:w-56 md:h-56 transform -rotate-90">
          <circle
            cx={isMobile ? 80 : 112}
            cy={isMobile ? 80 : 112}
            r={isMobile ? 60 : 80}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-white/5"
          />
          <circle
            cx={isMobile ? 80 : 112}
            cy={isMobile ? 80 : 112}
            r={isMobile ? 60 : 80}
            fill="none"
            stroke="currentColor"
            strokeWidth="6 md:strokeWidth-8"
            strokeLinecap="round"
            className={`text-neo-cyan transition-all duration-700 ease-out ${isAnimating ? 'opacity-50' : ''}`}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{
              filter: 'drop-shadow(0 0 8px rgba(102, 252, 241, 0.4))',
            }}
          />
        </svg>
        
        <div className="absolute text-center">
          <div className="text-[8px] md:text-[10px] font-mono text-neo-slate/40 uppercase tracking-widest mb-1">Yield</div>
          <div className={`text-4xl md:text-6xl font-black font-heading text-white tracking-tighter transition-all duration-300 ${isAnimating ? 'scale-110 text-neo-cyan neo-text-glow' : ''}`}>
            {displayScore}
          </div>
          <div className="text-[8px] md:text-xs font-mono text-neo-cyan/60 mt-1">
            / {maxScore} PTS
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Progress Bar */}
        <div>
          <div className="flex justify-between text-[10px] font-mono uppercase tracking-widest mb-2 text-neo-slate/60">
            <span>Synchronization</span>
            <span className="text-neo-cyan">{percentage}%</span>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/10">
            <div
              className="h-full bg-neo-cyan rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(102,252,241,0.5)]"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Time Entry - Chronometer Style */}
        <div className="pt-6 border-t border-white/5">
          <label className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] text-neo-slate/60 mb-3">
            <Clock className="w-3 h-3 text-neo-amber" />
            Mission Duration (SEC)
          </label>
          <div className="relative group">
            <input
              type="number"
              min="0"
              max="300"
              value={timeSeconds}
              onChange={(e) => onTimeChange(e.target.value)}
              className="w-full bg-neo-void/50 border border-white/10 rounded-xl px-5 py-4 text-2xl font-mono text-neo-amber focus:border-neo-amber/50 focus:ring-1 focus:ring-neo-amber/20 outline-none transition-all placeholder:text-white/5"
            />
            <Zap className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-neo-amber/20 group-focus-within:text-neo-amber/50 transition-colors" />
          </div>
          <p className="text-[10px] font-mono text-neo-slate/30 mt-3 flex items-center gap-2 uppercase tracking-tighter">
            <AlertCircle className="w-3 h-3" />
            Standard Baseline: 180s // REFERENCE ONLY
          </p>
        </div>
      </div>
    </div>
  );
};

export default ScoreDisplay;
