import React, { useState } from 'react';
import { RotateCcw, Save, Clock } from 'lucide-react';
import { Button } from '../ui/Button';
import { AudioPlayer } from '../ui/AudioPlayer';

interface PreviewStepProps {
  audioUrl: string;
  audioBlob: Blob;
  guestName: string;
  eventName: string;
  duration: number;
  onSave: () => Promise<void>;
  onRecordAgain: () => void | Promise<void>;
}

export const PreviewStep: React.FC<PreviewStepProps> = ({
  audioUrl,
  guestName,
  eventName,
  duration,
  onSave,
  onRecordAgain,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      await onSave();
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : 'Failed to save. Please try again.'
      );
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-8 py-12 text-center gap-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-400/15 border border-yellow-300/30 mb-6">
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-300" />
          <span className="text-yellow-200 text-sm font-semibold uppercase tracking-wide">
            Preview
          </span>
        </div>

        <h2 className="text-4xl font-bold text-white mb-2">
          Listen back 🎧
        </h2>
        <p className="text-white/50 text-lg">
          Happy with your message? Go ahead and save it!
        </p>
      </div>

      {/* Message Card */}
      <div className="w-full max-w-sm bg-black/40 border border-yellow-300/20 rounded-3xl p-6 backdrop-blur-sm">
        <div className="flex items-start justify-between mb-5">
          <div className="text-left">
            <p className="text-white font-semibold text-lg">
              {guestName || 'Anonymous Guest'}
            </p>
            <p className="text-white/40 text-sm">{eventName}</p>
          </div>
          <div className="flex items-center gap-1.5 text-white/40 text-sm">
            <Clock size={14} />
            <span>{formatDuration(duration)}</span>
          </div>
        </div>

        <AudioPlayer src={audioUrl} />
      </div>

      {/* Error */}
      {saveError && (
        <div className="w-full max-w-sm px-4 py-3 rounded-xl bg-red-500/20 border border-red-400/30 text-red-300 text-sm">
          {saveError}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-3 w-full max-w-sm">
        <Button
          variant="success"
          size="xl"
          icon={<Save size={22} />}
          onClick={handleSave}
          loading={isSaving}
          className="w-full text-xl py-6"
        >
          {isSaving ? 'Saving…' : 'Save Message'}
        </Button>

        <Button
          variant="secondary"
          size="lg"
          icon={<RotateCcw size={18} />}
          onClick={() => {
            void onRecordAgain();
          }}
          disabled={isSaving}
          className="w-full"
        >
          Record Again
        </Button>
      </div>
    </div>
  );
};
