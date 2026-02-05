import { useState, useEffect } from 'react';

interface CountdownTimerProps {
  targetDate: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const RollingDigit = ({ value }: { value: number }) => {
  const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  
  return (
    <div className="relative h-[1.2em] overflow-hidden leading-none">
      <div 
        className="flex flex-col transition-transform duration-700 ease-[cubic-bezier(0.45,0.05,0.55,0.95)]"
        style={{ transform: `translateY(-${value * 10}%)` }}
      >
        {digits.map((digit) => (
          <div key={digit} className="h-[1.2em] flex items-center justify-center">
            {digit}
          </div>
        ))}
      </div>
    </div>
  );
};

const TimeSection = ({ value, label, colorClass }: { value: number, label: string, colorClass: string }) => {
  const tens = Math.floor(value / 10);
  const ones = value % 10;

  return (
    <div className="flex flex-col items-center">
      <div className={`flex text-6xl md:text-8xl font-black font-heading tracking-tighter ${colorClass}`}>
        <RollingDigit value={tens} />
        <RollingDigit value={ones} />
      </div>
      <span className="text-[10px] font-mono uppercase tracking-[0.4em] text-neo-slate/30 mt-2">
        {label}
      </span>
    </div>
  );
};

export default function CountdownTimer({ targetDate }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const target = new Date(targetDate).getTime();

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
          <span className="text-2xl font-heading font-black text-neo-cyan uppercase tracking-widest neo-text-glow">
            Mission Commenced
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex justify-center items-baseline gap-4 md:gap-12">
        <TimeSection value={timeLeft.days} label="Days" colorClass="text-white" />
        <div className="text-4xl font-black text-white/10 self-center -mt-6">:</div>
        <TimeSection value={timeLeft.hours} label="Hours" colorClass="text-white" />
        <div className="text-4xl font-black text-white/10 self-center -mt-6">:</div>
        <TimeSection value={timeLeft.minutes} label="Mins" colorClass="text-neo-cyan neo-text-glow" />
        <div className="text-4xl font-black text-white/10 self-center -mt-6">:</div>
        <TimeSection value={timeLeft.seconds} label="Secs" colorClass="text-neo-amber" />
      </div>
    </div>
  );
}
