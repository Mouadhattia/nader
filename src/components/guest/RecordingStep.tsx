import React, { useEffect } from 'react';
import { Square, AlertCircle, Volume2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { RecordingTimer } from '../ui/RecordingTimer';
import { SoundWave } from '../ui/SoundWave';
import { RecorderState } from '../../hooks/useAudioRecorder';

interface RecordingStepProps {
  guestName: string;
  recorderState: RecorderState;
  audioBlob: Blob | null;
  audioUrl: string | null;
  elapsedSeconds: number;
  errorMessage: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  resetRecording: () => void;
  onFinished: (blob: Blob, url: string, duration: number) => void;
  onCancel: () => void;
}

export const RecordingStep: React.FC<RecordingStepProps> = ({
  guestName,
  recorderState,
  audioBlob,
  audioUrl,
  elapsedSeconds,
  errorMessage,
  startRecording,
  stopRecording,
  resetRecording,
  onFinished,
  onCancel,
}) => {
  // When recording stops, move to preview
  useEffect(() => {
    if (recorderState === 'stopped' && audioBlob && audioUrl) {
      onFinished(audioBlob, audioUrl, elapsedSeconds);
    }
  }, [audioBlob, audioUrl, elapsedSeconds, onFinished, recorderState]);

  const handleCancel = () => {
    resetRecording();
    onCancel();
  };

  const handleRetry = () => {
    resetRecording();
    void startRecording();
  };

  if (recorderState === 'requesting') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-8 text-center gap-6">
        <div className="w-20 h-20 rounded-full border-4 border-yellow-300/30 border-t-yellow-300 animate-spin" />
        <h2 className="text-2xl font-semibold text-white">Requesting microphone access…</h2>
        <p className="text-white/50">Please allow microphone access when prompted</p>
      </div>
    );
  }

  if (recorderState === 'playingWelcome') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-8 text-center gap-6">
        <div className="w-20 h-20 rounded-full bg-yellow-400/15 border border-yellow-300/30 flex items-center justify-center">
          <Volume2 size={38} className="text-yellow-300" />
        </div>
        <h2 className="text-2xl font-semibold text-white">Playing welcome audio…</h2>
        <p className="text-white/50 max-w-sm">
          Recording will start automatically after the host greeting.
        </p>
      </div>
    );
  }

  if (recorderState === 'error') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-8 text-center gap-6">
        <div className="w-20 h-20 rounded-full bg-red-500/20 border border-red-400/30 flex items-center justify-center">
          <AlertCircle size={40} className="text-red-400" />
        </div>
        <h2 className="text-3xl font-bold text-white">Microphone Error</h2>
        <p className="text-white/60 max-w-sm text-lg">{errorMessage}</p>
        <div className="flex gap-4 flex-col w-full max-w-xs">
          <Button variant="primary" size="lg" onClick={handleRetry}>
            Try Again
          </Button>
          <Button variant="ghost" size="lg" onClick={handleCancel}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-8 py-12 text-center gap-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-400/15 border border-yellow-300/30 mb-6">
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-300 animate-pulse" />
          <span className="text-yellow-200 text-sm font-semibold uppercase tracking-wide">
            Recording
          </span>
        </div>

        <h2 className="text-3xl font-bold text-white mb-2">
          {guestName ? `Hey ${guestName}! 🎙️` : 'Recording… 🎙️'}
        </h2>
        <p className="text-white/50 text-lg">Speak clearly into the microphone</p>
      </div>

      {/* Sound Wave */}
      <SoundWave active={recorderState === 'recording'} bars={16} />

      {/* Timer */}
      <RecordingTimer seconds={elapsedSeconds} maxSeconds={180} />

      {/* Stop Button */}
      <Button
        variant="danger"
        size="xl"
        icon={<Square size={22} fill="currentColor" />}
        onClick={stopRecording}
        disabled={recorderState !== 'recording'}
        className="w-full max-w-xs text-xl py-6 mt-2"
      >
        Stop Recording
      </Button>

      <button
        onClick={handleCancel}
        className="text-white/30 hover:text-white/60 text-sm transition-colors"
      >
        Cancel
      </button>
    </div>
  );
};
