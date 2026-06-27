import React from 'react';

interface SoundWaveProps {
  active: boolean;
  bars?: number;
}

export const SoundWave: React.FC<SoundWaveProps> = ({ active, bars = 12 }) => {
  return (
    <div className="flex items-center justify-center gap-1 h-16">
      {Array.from({ length: bars }).map((_, i) => (
        <div
          key={i}
          className={`w-1.5 rounded-full transition-all ${
            active ? 'bg-yellow-400' : 'bg-white/20'
          }`}
          style={
            active
              ? {
                  height: `${20 + Math.random() * 100}%`,
                  animation: `soundWave ${0.6 + (i % 4) * 0.15}s ease-in-out infinite alternate`,
                  animationDelay: `${(i * 0.07).toFixed(2)}s`,
                }
              : { height: '20%' }
          }
        />
      ))}

      <style>{`
        @keyframes soundWave {
          from { transform: scaleY(0.3); opacity: 0.6; }
          to   { transform: scaleY(1);   opacity: 1;   }
        }
      `}</style>
    </div>
  );
};
