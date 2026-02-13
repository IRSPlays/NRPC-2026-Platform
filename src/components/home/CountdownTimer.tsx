import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CountdownTimerProps {
  targetDate: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const Digit = ({ value }: { value: string }) => (
  <div className="relative h-[1em] w-[0.6em] overflow-hidden inline-block">
    <AnimatePresence mode="popLayout">
      <motion.span
        key={value}
        initial={{ y: "100%" }}
        animate={{ y: "0%" }}
        exit={{ y: "-100%" }}
        transition={{ duration: 0.5, ease: "backOut" }}
        className="absolute inset-0 flex items-center justify-center leading-none"
      >
        {value}
      </motion.span>
    </AnimatePresence>
  </div>
);

const TimeSection = ({ value, label, colorClass, digitsCount = 2 }: { value: number, label: string, colorClass: string, digitsCount?: number }) => {
  const valString = value.toString().padStart(digitsCount, '0');
  const digits = valString.split('');

  return (
    <div className="flex flex-col items-center" aria-live="polite" aria-label={label} role="status">
      <div className={`flex font-heading font-black tracking-tighter text-4xl sm:text-6xl md:text-8xl lg:text-9xl ${colorClass} h-[1em] overflow-hidden`}>
        {digits.map((d, i) => (
          <Digit key={i} value={d} />
        ))}
      </div>
      <span className="text-[10px] sm:text-xs md:text-sm font-mono uppercase tracking-[0.2em] text-neo-slate/40 mt-2 md:mt-4">
        {label}
      </span>
    </div>
  );
};

export default function CountdownTimer({ targetDate }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const target = new Date(targetDate).getTime();
    if (Number.isNaN(target)) {
      setIsExpired(true);
      setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      return;
    }

    const updateCountdown = () => {
      const now = Date.now();
      const diff = target - now;

      if (diff <= 0) {
        setIsExpired(true);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (isExpired) {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center gap-3 px-8 py-4 bg-neo-cyan/10 rounded-2xl border border-neo-cyan/20">
          <span className="text-lg sm:text-2xl font-heading font-black text-neo-cyan uppercase tracking-widest neo-text-glow">
            Mission Commenced
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex justify-center items-center select-none">
      <div className="flex items-start gap-2 sm:gap-6 md:gap-12">
        <TimeSection value={timeLeft.days} label="Days" colorClass="text-white" digitsCount={3} />
        <div className="text-2xl sm:text-4xl md:text-6xl font-black text-white/10 pt-2 sm:pt-4">:</div>
        <TimeSection value={timeLeft.hours} label="Hours" colorClass="text-white" />
        <div className="text-2xl sm:text-4xl md:text-6xl font-black text-white/10 pt-2 sm:pt-4">:</div>
        <TimeSection value={timeLeft.minutes} label="Mins" colorClass="text-neo-cyan neo-text-glow" />
        <div className="text-2xl sm:text-4xl md:text-6xl font-black text-white/10 pt-2 sm:pt-4">:</div>
        <TimeSection value={timeLeft.seconds} label="Secs" colorClass="text-neo-amber" />
      </div>
    </div>
  );
}
