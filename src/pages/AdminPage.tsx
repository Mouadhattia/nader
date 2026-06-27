import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  CalendarDays,
  RefreshCw,
  Mic,
  Music2,
  Headphones,
  ExternalLink,
  X,
} from 'lucide-react';
import { fetchRecordings, deleteRecording, isMockMode } from '../api/recordings';
import {
  createEvent,
  deleteEventWelcomeAudio,
  deleteEvent,
  fetchEvents,
  updateEvent,
  uploadEventWelcomeAudio,
} from '../api/events';
import { EventPayload, GuestBookEvent, Recording } from '../types';
import { RecordingCard } from '../components/admin/RecordingCard';
import { StatsBar } from '../components/admin/StatsBar';
import { DemoBanner } from '../components/admin/DemoBanner';
import { EventManager } from '../components/admin/EventManager';

type AdminTab = 'recordings' | 'events';

function recordingMatchesEvent(recording: Recording, event: GuestBookEvent) {
  return recording.eventId === event._id || (!recording.eventId && recording.eventName === event.name);
}

export const AdminPage: React.FC = () => {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [events, setEvents] = useState<GuestBookEvent[]>([]);
  const [activeTab, setActiveTab] = useState<AdminTab>('recordings');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [demoMode, setDemoMode] = useState(false);

  const loadDashboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const [recordingData, eventData] = await Promise.all([
        fetchRecordings(),
        fetchEvents(),
      ]);
      setRecordings(recordingData);
      setEvents(eventData);
      setLastRefreshed(new Date());
      setDemoMode(isMockMode());
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load recordings.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleDelete = useCallback(async (id: string) => {
    await deleteRecording(id);
    setRecordings((prev) => prev.filter((r) => r._id !== id));
  }, []);

  const handleCreateEvent = useCallback(async (payload: EventPayload) => {
    const event = await createEvent(payload);
    setEvents((prev) => [event, ...prev]);
  }, []);

  const handleUpdateEvent = useCallback(async (id: string, payload: EventPayload) => {
    const event = await updateEvent(id, payload);
    setEvents((prev) => prev.map((item) => (item._id === id ? event : item)));
  }, []);

  const handleDeleteEvent = useCallback(async (id: string) => {
    await deleteEvent(id);
    setEvents((prev) => prev.filter((event) => event._id !== id));
    setSelectedEventId((current) => (current === id ? null : current));
  }, []);

  const handleUploadWelcomeAudio = useCallback(async (id: string, audio: Blob) => {
    const event = await uploadEventWelcomeAudio(id, audio);
    setEvents((prev) => prev.map((item) => (item._id === id ? event : item)));
  }, []);

  const handleDeleteWelcomeAudio = useCallback(async (id: string) => {
    const event = await deleteEventWelcomeAudio(id);
    setEvents((prev) => prev.map((item) => (item._id === id ? event : item)));
  }, []);

  const handleRefresh = () => loadDashboard(true);

  const selectedEvent = useMemo(
    () => events.find((event) => event._id === selectedEventId) || null,
    [events, selectedEventId]
  );

  const visibleRecordings = useMemo(
    () =>
      selectedEvent
        ? recordings.filter((recording) => recordingMatchesEvent(recording, selectedEvent))
        : recordings,
    [recordings, selectedEvent]
  );

  const recordingCounts = useMemo(() => {
    return events.reduce<Record<string, number>>((counts, event) => {
      counts[event._id] = recordings.filter((recording) =>
        recordingMatchesEvent(recording, event)
      ).length;
      return counts;
    }, {});
  }, [events, recordings]);

  const handleOpenEventRecordings = useCallback((event: GuestBookEvent) => {
    setSelectedEventId(event._id);
    setActiveTab('recordings');
  }, []);

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="bg-black border-b border-yellow-300/20 sticky top-0 z-30 shadow-sm shadow-yellow-400/5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-400 flex items-center justify-center flex-shrink-0">
              <Headphones size={20} className="text-black" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white leading-none">
                Audio Guest Book
              </h1>
              <p className="text-xs text-zinc-500 mt-0.5">Admin Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/guest"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 text-sm text-yellow-300 hover:text-yellow-200 font-medium transition-colors"
            >
              <ExternalLink size={14} />
              Guest Page
            </a>

            <button
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-yellow-400 border border-yellow-300/15 text-zinc-200 hover:text-black text-sm font-medium transition-all disabled:opacity-50 active:scale-95"
            >
              <RefreshCw
                size={15}
                className={refreshing ? 'animate-spin' : ''}
              />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        {/* Demo Banner */}
        {demoMode && !loading && <DemoBanner />}

        {/* Page Title */}
        <div className="mb-5 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-2xl font-bold text-white">
              {activeTab === 'recordings'
                ? selectedEvent
                  ? selectedEvent.name
                  : 'Recordings'
                : 'Events'}
            </h2>
            {lastRefreshed && (
              <p className="text-sm text-zinc-500 mt-0.5">
                Last updated{' '}
                {lastRefreshed.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            )}
          </div>

          {!loading && !error && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-400/15 border border-yellow-300/25 text-yellow-300 text-sm font-medium">
              {activeTab === 'recordings' ? <Mic size={14} /> : <CalendarDays size={14} />}
              {activeTab === 'recordings'
                ? `${visibleRecordings.length} message${visibleRecordings.length !== 1 ? 's' : ''}`
                : `${events.length} event${events.length !== 1 ? 's' : ''}`}
            </div>
          )}
        </div>

        <div className="mb-6 inline-flex p-1 rounded-2xl bg-zinc-950 border border-yellow-300/15">
          {[
            { id: 'recordings' as AdminTab, label: 'Recordings', icon: Mic },
            { id: 'events' as AdminTab, label: 'Events', icon: CalendarDays },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-yellow-400 text-black'
                  : 'text-zinc-400 hover:text-yellow-200'
              }`}
            >
              <tab.icon size={15} />
              {tab.label}
            </button>
          ))}
        </div>

        {!loading && !error && activeTab === 'recordings' && selectedEvent && (
          <div className="mb-6 flex items-center justify-between gap-4 rounded-2xl bg-yellow-400/10 border border-yellow-300/20 px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-yellow-200 truncate">
                Viewing recordings for {selectedEvent.name}
              </p>
              <p className="text-xs text-zinc-500">
                Only messages attached to this event are shown.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedEventId(null)}
              className="flex-shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-yellow-400 border border-yellow-300/10 text-zinc-300 hover:text-black text-sm font-semibold transition-all"
            >
              <X size={14} />
              All
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-zinc-800 border-t-yellow-400 animate-spin" />
            <p className="text-zinc-500">Loading recordings…</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="p-6 bg-zinc-950 rounded-2xl border border-yellow-300/15 shadow-sm shadow-yellow-400/5 max-w-md w-full text-center">
              <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
                <Music2 size={28} className="text-red-400" />
              </div>
              <h3 className="font-semibold text-white mb-2">Could not load recordings</h3>
              <p className="text-zinc-400 text-sm mb-4">{error}</p>
              <button
                onClick={handleRefresh}
                className="px-6 py-2.5 rounded-xl bg-yellow-400 text-black text-sm font-medium hover:bg-yellow-300 transition-colors"
              >
                Try Again
              </button>
            </div>

            <div className="p-4 bg-yellow-400/10 border border-yellow-300/25 rounded-xl max-w-md w-full">
              <p className="text-yellow-200 text-sm font-semibold mb-1">💡 Start the backend</p>
              <div className="space-y-1 text-yellow-100/80 text-xs font-mono">
                <p>cd backend</p>
                <p>npm install</p>
                <p>cp .env.example .env</p>
                <p>npm start</p>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && activeTab === 'recordings' && visibleRecordings.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-20 h-20 rounded-2xl bg-zinc-950 border border-yellow-300/20 flex items-center justify-center">
              <Music2 size={36} className="text-yellow-300" />
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-white text-lg mb-1">
                {selectedEvent ? 'No recordings for this event yet' : 'No recordings yet'}
              </h3>
              <p className="text-zinc-500 text-sm">
                {selectedEvent ? 'Guests can leave messages from the ' : 'Guests can start recording at the '}
                <a
                  href="/guest"
                  className="text-yellow-300 hover:text-yellow-200 underline underline-offset-2"
                >
                  Guest Page
                </a>
              </p>
            </div>
          </div>
        )}

        {/* Stats + Recordings */}
        {!loading && !error && activeTab === 'recordings' && visibleRecordings.length > 0 && (
          <>
            <StatsBar recordings={visibleRecordings} />

            <div className="flex flex-col gap-4">
              {visibleRecordings.map((recording, index) => (
                <RecordingCard
                  key={recording._id}
                  recording={recording}
                  index={index}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </>
        )}

        {!loading && !error && activeTab === 'events' && (
          <EventManager
            events={events}
            onCreate={handleCreateEvent}
            onUpdate={handleUpdateEvent}
            onDelete={handleDeleteEvent}
            onOpenRecordings={handleOpenEventRecordings}
            recordingCounts={recordingCounts}
            onUploadWelcomeAudio={handleUploadWelcomeAudio}
            onDeleteWelcomeAudio={handleDeleteWelcomeAudio}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto px-4 sm:px-6 py-8 mt-4 border-t border-yellow-300/15">
        <p className="text-center text-zinc-500 text-sm">
          Audio Guest Book — Admin Dashboard
        </p>
      </footer>
    </div>
  );
};
