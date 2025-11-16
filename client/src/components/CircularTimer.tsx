import { useEffect, useState } from "react";

interface CircularTimerProps {
  timeRemaining: number;
  totalTime: number;
  className?: string;
}

export function CircularTimer({ timeRemaining, totalTime, className = "" }: CircularTimerProps) {
  const [prevTime, setPrevTime] = useState(timeRemaining);
  const percentage = (timeRemaining / totalTime) * 100;
  const circumference = 2 * Math.PI * 36;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  useEffect(() => {
    setPrevTime(timeRemaining);
  }, [timeRemaining]);

  const getColor = () => {
    if (percentage > 50) return "text-green-500";
    if (percentage > 20) return "text-yellow-500";
    return "text-red-500";
  };

  const shouldPulse = timeRemaining <= 5;

  return (
    <div className={`relative ${className}`} data-testid="timer-display">
      <svg className="transform -rotate-90" width="100" height="100">
        <circle
          cx="50"
          cy="50"
          r="36"
          stroke="currentColor"
          strokeWidth="6"
          fill="none"
          className="text-muted"
        />
        <circle
          cx="50"
          cy="50"
          r="36"
          stroke="currentColor"
          strokeWidth="6"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className={`${getColor()} transition-all duration-200`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className={`text-3xl font-bold ${getColor()} ${shouldPulse ? "animate-pulse-slow" : ""}`}
        >
          {timeRemaining}
        </span>
      </div>
    </div>
  );
}
