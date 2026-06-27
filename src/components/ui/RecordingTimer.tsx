import React from 'react';

interface RecordingTimerProps {
  seconds: number;
  maxSeconds?: number;
}

export const RecordingTimer: React.FC<RecordingTimerProps> = ({
  seconds,
  maxSeconds = 180,
}) => {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const progress = (seconds / maxSeconds) * 100;
  const isNearEnd = seconds >= maxSeconds - 30;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Digital Timer */}
      <div
        className={`font-mono text-6xl font-bold tabular-nums transition-colors ${
          isNearEnd ? 'text-red-400' : 'text-white'
        }`}
      >
        {String(minutes).padStart(2, '0')}:{String(secs).padStart(2, '0')}
      </div>

      {/* Progress Bar */}
      <div className="w-48 h-1.5 bg-white/20 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${
            isNearEnd ? 'bg-red-400' : 'bg-yellow-400'
          }`}
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>

      {isNearEnd && (
        <p className="text-red-300 text-sm font-medium animate-pulse">
          {maxSeconds - seconds} seconds remaining
        </p>
      )}
    </div>
  );
};
