import React, { useEffect, useState } from 'react';
import { Trophy, Clock, AlertCircle } from 'lucide-react';

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

  // Animate score changes
  useEffect(() => {
    if (displayScore !== totalScore) {
      setIsAnimating(true);
      const diff = totalScore - displayScore;
      const steps = 10;
      const stepValue = diff / steps;
      let currentStep = 0;

      const interval = setInterval(() => {
        currentStep++;
        if (currentStep >= steps) {
          setDisplayScore(totalScore);
          setIsAnimating(false);
          clearInterval(interval);
        } else {
          setDisplayScore(prev => Math.round(prev + stepValue));
        }
      }, 30);

      return () => clearInterval(interval);
    }
  }, [totalScore, displayScore]);

  const percentage = Math.round((totalScore / maxScore) * 100);
  const circumference = 2 * Math.PI * 120;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 sticky top-24">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
        <Trophy className="w-5 h-5 text-[#0D7377]" />
        Total Score
      </h2>

      {/* Circular Score Display */}
      <div className="relative flex items-center justify-center mb-6">
        <svg className="w-48 h-48 transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="96"
            cy="96"
            r="88"
            fill="none"
            stroke="currentColor"
            strokeWidth="12"
            className="text-slate-100 dark:text-slate-700"
          />
          {/* Progress circle */}
          <circle
            cx="96"
            cy="96"
            r="88"
            fill="none"
            stroke="currentColor"
            strokeWidth="12"
            strokeLinecap="round"
            className={`text-[#0D7377] transition-all duration-500 ${isAnimating ? 'text-[#14FFEC]' : ''}`}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{
              filter: 'drop-shadow(0 0 6px rgba(13, 115, 119, 0.5))',
            }}
          />
        </svg>
        <div className="absolute text-center">
          <div className={`text-5xl font-bold font-['Space_Grotesk'] text-slate-900 dark:text-slate-100 transition-all duration-300 ${isAnimating ? 'scale-110 text-[#0D7377]' : ''}`}>
            {displayScore}
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            of {maxScore}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-slate-600 dark:text-slate-400">Completion</span>
          <span className="font-semibold text-slate-900 dark:text-slate-100">{percentage}%</span>
        </div>
        <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#0D7377] to-[#14FFEC] rounded-full transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Time Input */}
      <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          <Clock className="w-4 h-4 text-[#0D7377]" />
          Time Taken (seconds)
        </label>
        <input
          type="number"
          min="0"
          max="300"
          value={timeSeconds}
          onChange={(e) => onTimeChange(e.target.value)}
          placeholder="180"
          className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#0D7377] focus:border-transparent outline-none transition-all text-lg font-mono"
        />
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          Default: 180s (3 minutes). Time is for reference only.
        </p>
      </div>

      {/* Score Breakdown */}
      <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
        <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
          Quick Stats
        </h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500 dark:text-slate-400">Missions Completed</span>
            <span className="font-medium text-slate-900 dark:text-slate-100">
              {totalScore > 0 ? Math.min(7, Math.ceil((totalScore / maxScore) * 7)) : 0} / 7
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500 dark:text-slate-400">Points Remaining</span>
            <span className="font-medium text-slate-900 dark:text-slate-100">
              {maxScore - totalScore}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScoreDisplay;
