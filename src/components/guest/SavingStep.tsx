import React from 'react';
import { AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react';
import { Button } from '../ui/Button';

interface SavingStepProps {
  errorMessage: string | null;
  onRetry: () => void;
  onStartOver: () => void;
}

/**
 * Shown while the finished recording uploads. The guest never has to confirm —
 * stopping the recording (on screen or via the Raspberry Pi phone button)
 * saves it straight away. Buttons only appear if the upload actually failed.
 */
export const SavingStep: React.FC<SavingStepProps> = ({
  errorMessage,
  onRetry,
  onStartOver,
}) => {
  if (errorMessage) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-8 text-center gap-6">
        <div className="w-20 h-20 rounded-full bg-red-500/20 border border-red-400/30 flex items-center justify-center">
          <AlertCircle size={40} className="text-red-400" />
        </div>
        <h2 className="text-3xl font-bold text-white">Could not save</h2>
        <p className="text-white/60 max-w-sm text-lg">{errorMessage}</p>
        <div className="flex gap-4 flex-col w-full max-w-xs">
          <Button
            variant="primary"
            size="lg"
            icon={<RefreshCw size={20} />}
            onClick={onRetry}
          >
            Try Again
          </Button>
          <Button
            variant="ghost"
            size="lg"
            icon={<ArrowLeft size={20} />}
            onClick={onStartOver}
          >
            Start Over
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-8 text-center gap-6">
      <div className="w-20 h-20 rounded-full border-4 border-yellow-300/30 border-t-yellow-300 animate-spin" />
      <h2 className="text-3xl font-bold text-white">Saving your message…</h2>
      <p className="text-white/50 max-w-sm text-lg">
        Hang on a moment, this only takes a few seconds.
      </p>
    </div>
  );
};
