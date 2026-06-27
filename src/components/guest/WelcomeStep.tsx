import React, { useState } from 'react';
import { ArrowLeft, Mic, Music } from 'lucide-react';
import { Button } from '../ui/Button';
import { AudioPlayer } from '../ui/AudioPlayer';

interface WelcomeStepProps {
  eventName: string;
  welcomeMessage?: string;
  welcomeAudioUrl?: string;
  onStart: (guestName: string) => void | Promise<void>;
  onBack?: () => void;
}

export const WelcomeStep: React.FC<WelcomeStepProps> = ({
  eventName,
  welcomeMessage,
  welcomeAudioUrl,
  onStart,
  onBack,
}) => {
  const [name, setName] = useState('');

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-8 py-12 text-center">
      {/* Icon */}
      <div className="relative mb-8">
        <div className="w-28 h-28 rounded-full bg-yellow-400/15 border border-yellow-300/30 flex items-center justify-center backdrop-blur-sm">
          <Music size={52} className="text-yellow-300" />
        </div>
        <div className="absolute -inset-2 rounded-full border border-yellow-300/15 animate-ping" />
      </div>

      {/* Heading */}
      <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-3 leading-tight">
        Audio<br />
        <span className="text-yellow-300">Guest Book</span>
      </h1>

      <p className="text-xl text-white/60 mb-2 font-light">
        You're invited to leave a message for
      </p>
      <p className="text-2xl text-white font-semibold mb-10">
        {eventName}
      </p>

      {welcomeMessage && (
        <div className="w-full max-w-sm mb-4 px-5 py-4 rounded-2xl bg-black/35 border border-yellow-300/20 text-left backdrop-blur-sm">
          <p className="text-xs uppercase tracking-wide text-yellow-200 font-semibold mb-2">
            Welcome note
          </p>
          <p className="text-white/65 text-sm leading-relaxed">{welcomeMessage}</p>
        </div>
      )}

      {welcomeAudioUrl && (
        <div className="w-full max-w-sm mb-8 px-5 py-4 rounded-2xl bg-black/35 border border-yellow-300/20 text-left backdrop-blur-sm">
          <p className="text-xs uppercase tracking-wide text-yellow-200 font-semibold mb-3">
            Audio welcome message
          </p>
          <AudioPlayer src={welcomeAudioUrl} />
        </div>
      )}

      {/* Name Input */}
      <div className="w-full max-w-sm mb-8">
        <label className="block text-white/70 text-sm font-medium mb-2 text-left">
          Your name <span className="text-white/40">(optional)</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void onStart(name.trim());
          }}
          placeholder="e.g. Sarah & John"
          maxLength={60}
          className="w-full px-5 py-4 rounded-2xl bg-black/35 border border-yellow-300/25 text-white placeholder-white/30 text-lg focus:outline-none focus:ring-2 focus:ring-yellow-300/50 focus:border-yellow-300/50 backdrop-blur-sm transition-all"
        />
      </div>

      {/* CTA */}
      <Button
        variant="primary"
        size="xl"
        icon={<Mic size={24} />}
        onClick={() => {
          void onStart(name.trim());
        }}
        className="w-full max-w-sm text-2xl py-6 rounded-2xl"
      >
        Start Recording
      </Button>

      <p className="mt-6 text-white/30 text-sm">
        {welcomeAudioUrl
          ? 'The host audio greeting will play before recording starts'
          : 'Recording will start after microphone permission'}
      </p>

      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="mt-5 inline-flex items-center gap-2 text-white/40 hover:text-yellow-200 text-sm transition-colors"
        >
          <ArrowLeft size={15} />
          Change event
        </button>
      )}
    </div>
  );
};
