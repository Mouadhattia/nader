import React from 'react';
import { CalendarDays, Music, RefreshCw } from 'lucide-react';
import { GuestBookEvent } from '../../types';
import { Button } from '../ui/Button';

interface EventSelectStepProps {
  events: GuestBookEvent[];
  loading: boolean;
  error: string | null;
  onSelect: (event: GuestBookEvent) => void;
  onRefresh: () => void;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const EventSelectStep: React.FC<EventSelectStepProps> = ({
  events,
  loading,
  error,
  onSelect,
  onRefresh,
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12 text-center">
      <div className="relative mb-8">
        <div className="w-24 h-24 rounded-full bg-yellow-400/15 border border-yellow-300/30 flex items-center justify-center backdrop-blur-sm">
          <CalendarDays size={44} className="text-yellow-300" />
        </div>
        <div className="absolute -inset-2 rounded-full border border-yellow-300/15 animate-ping" />
      </div>

      <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-3 leading-tight">
        Select <span className="text-yellow-300">Event</span>
      </h1>
      <p className="text-white/55 mb-8 max-w-md">
        Choose the celebration you want to leave a message for.
      </p>

      {loading && (
        <div className="flex flex-col items-center gap-4 py-10">
          <div className="w-12 h-12 rounded-full border-4 border-yellow-300/30 border-t-yellow-300 animate-spin" />
          <p className="text-white/50">Loading events…</p>
        </div>
      )}

      {!loading && error && (
        <div className="w-full max-w-md bg-black/40 border border-red-400/30 rounded-3xl p-6 backdrop-blur-sm">
          <p className="font-semibold text-red-200 mb-2">Could not load events</p>
          <p className="text-sm text-white/50 mb-5">{error}</p>
          <Button
            type="button"
            variant="primary"
            size="md"
            icon={<RefreshCw size={16} />}
            onClick={onRefresh}
          >
            Try Again
          </Button>
        </div>
      )}

      {!loading && !error && events.length === 0 && (
        <div className="w-full max-w-md bg-black/40 border border-yellow-300/20 rounded-3xl p-6 backdrop-blur-sm">
          <Music size={34} className="text-yellow-300 mx-auto mb-3" />
          <p className="font-semibold text-white mb-1">No active events</p>
          <p className="text-sm text-white/50">
            Ask the host to create or activate an event from the admin dashboard.
          </p>
        </div>
      )}

      {!loading && !error && events.length > 0 && (
        <div className="w-full max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-4">
          {events.map((event) => (
            <button
              key={event._id}
              type="button"
              onClick={() => onSelect(event)}
              className="text-left bg-black/45 hover:bg-yellow-400/10 border border-yellow-300/20 hover:border-yellow-300/45 rounded-3xl p-5 backdrop-blur-sm transition-all active:scale-[0.98]"
            >
              <div className="w-11 h-11 rounded-2xl bg-yellow-400 flex items-center justify-center mb-4">
                <Music size={22} className="text-black" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">{event.name}</h2>
              <p className="text-xs text-yellow-200/80 mb-3">
                {formatDate(event.startDate)} - {formatDate(event.endDate)}
              </p>
              {event.welcomeMessage && (
                <p className="text-sm text-white/55 line-clamp-3">
                  {event.welcomeMessage}
                </p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
