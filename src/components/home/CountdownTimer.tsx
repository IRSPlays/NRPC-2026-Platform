import { useState, useEffect } from 'react';

interface CountdownTimerProps {
  targetDate: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  milliseconds: number;
}

export default function CountdownTimer({ targetDate }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    milliseconds: 0,
  });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const target = new Date(targetDate).getTime();

    const updateCountdown = () => {
      const now = Date.now();
      const diff = target - now;

      if (diff <= 0) {
        setIsExpired(true);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, milliseconds: 0 });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      const milliseconds = Math.floor((diff % 1000) / 10);

      setTimeLeft({ days, hours, minutes, seconds, milliseconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 50);
    return () => clearInterval(interval);
  }, [targetDate]);

  const formatNumber = (num: number, padding: number = 2): string => {
    return num.toString().padStart(padding, '0');
  };

  if (isExpired) {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center gap-3 px-8 py-4 bg-earth-moss rounded-xl border-2 border-earth-terracotta">
          <span className="text-2xl font-heading font-bold text-earth-parchment">
            Competition Has Started!
          </span>
        </div>
      </div>
    );
  }

  const dateObj = new Date(targetDate);
  const dateStr = dateObj.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const timeStr = dateObj.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-earth-moss/20 rounded-full border border-earth-moss/30">
          <svg className="w-5 h-5 text-earth-moss" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-earth-moss font-medium">
            {dateStr} • {timeStr}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 md:gap-4">
        <div className="flex flex-col items-center">
          <div className="relative w-full aspect-square max-w-[100px] bg-gradient-to-br from-earth-moss to-earth-mossDark rounded-2xl border-2 border-earth-terracotta flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            <span className="countdown-digit text-4xl md:text-5xl lg:text-6xl">
              {formatNumber(timeLeft.days)}
            </span>
          </div>
          <span className="mt-2 text-sm font-medium text-earth-mossDark dark:text-earth-stone">
            DAYS
          </span>
        </div>

        <div className="flex flex-col items-center">
          <div className="relative w-full aspect-square max-w-[100px] bg-gradient-to-br from-earth-terracotta to-[#D68B6C] rounded-2xl border-2 border-earth-moss flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
            <span className="text-white text-4xl md:text-5xl lg:text-6xl font-heading font-bold">
              {formatNumber(timeLeft.hours)}
            </span>
          </div>
          <span className="mt-2 text-sm font-medium text-earth-mossDark dark:text-earth-stone">
            HOURS
          </span>
        </div>

        <div className="flex flex-col items-center">
          <div className="relative w-full aspect-square max-w-[100px] bg-gradient-to-br from-earth-moss to-earth-mossDark rounded-2xl border-2 border-earth-terracotta flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            <span className="countdown-digit text-4xl md:text-5xl lg:text-6xl">
              {formatNumber(timeLeft.minutes)}
            </span>
          </div>
          <span className="mt-2 text-sm font-medium text-earth-mossDark dark:text-earth-stone">
            MINUTES
          </span>
        </div>

        <div className="flex flex-col items-center">
          <div className="relative w-full aspect-square max-w-[100px] bg-gradient-to-br from-earth-terracotta to-[#D68B6C] rounded-2xl border-2 border-earth-moss flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
            <span className="text-white text-4xl md:text-5xl lg:text-6xl font-heading font-bold">
              {formatNumber(timeLeft.seconds)}
            </span>
          </div>
          <span className="mt-2 text-sm font-medium text-earth-mossDark dark:text-earth-stone">
            SECONDS
          </span>
        </div>
      </div>

      <div className="flex justify-center mt-4">
        <div className="flex items-center gap-1 px-3 py-1 bg-earth-moss/10 rounded-full border border-earth-moss/20">
          <div className="w-2 h-2 rounded-full bg-bio-glow animate-pulse-subtle" />
          <span className="text-xs text-earth-moss font-medium">
            {formatNumber(timeLeft.milliseconds, 2)} ms
          </span>
        </div>
      </div>
    </div>
  );
}
