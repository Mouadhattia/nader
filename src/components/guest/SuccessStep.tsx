import React, { useEffect, useState } from 'react';
import { Heart, ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';

interface SuccessStepProps {
  guestName: string;
  onNextGuest: () => void;
  autoResetSeconds?: number;
}

export const SuccessStep: React.FC<SuccessStepProps> = ({
  guestName,
  onNextGuest,
  autoResetSeconds = 15,
}) => {
  const [countdown, setCountdown] = useState(autoResetSeconds);

  useEffect(() => {
    if (countdown <= 0) {
      onNextGuest();
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, onNextGuest]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-8 py-12 text-center gap-8">
      {/* Animated Heart */}
      <div className="relative">
        <div className="w-32 h-32 rounded-full bg-yellow-400/15 border border-yellow-300/30 flex items-center justify-center">
          <Heart
            size={60}
            className="text-yellow-300"
            fill="currentColor"
            style={{ animation: 'heartbeat 1.2s ease-in-out infinite' }}
          />
        </div>
        <div className="absolute -inset-4 rounded-full border border-yellow-300/15 animate-ping" />
        <div className="absolute -inset-8 rounded-full border border-yellow-300/10 animate-ping animation-delay-300" />
      </div>

      {/* Message */}
      <div>
        <h2 className="text-5xl font-extrabold text-white mb-4">
          Thank you{guestName ? `, ${guestName}` : ''}! 🎉
        </h2>
        <p className="text-xl text-white/60 max-w-sm mx-auto leading-relaxed">
          Your message has been saved and will be cherished forever.
        </p>
      </div>

      {/* Confetti dots decoration */}
      <div className="flex gap-2">
        {['bg-yellow-300', 'bg-white', 'bg-yellow-500', 'bg-zinc-400', 'bg-yellow-200'].map(
          (color, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full ${color}`}
              style={{ animation: `bounce 0.8s ease-in-out ${i * 0.1}s infinite alternate` }}
            />
          )
        )}
      </div>

      {/* Next Guest */}
      <div className="flex flex-col items-center gap-3 w-full max-w-xs">
        <Button
          variant="primary"
          size="xl"
          icon={<ArrowRight size={22} />}
          onClick={onNextGuest}
          className="w-full text-xl py-6"
        >
          Next Guest
        </Button>
        <p className="text-white/30 text-sm">
          Auto-resetting in {countdown}s…
        </p>
      </div>

      <style>{`
        @keyframes heartbeat {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
        @keyframes bounce {
          from { transform: translateY(0); }
          to   { transform: translateY(-8px); }
        }
        .animation-delay-300 { animation-delay: 0.3s; }
      `}</style>
    </div>
  );
};
