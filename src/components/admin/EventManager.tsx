import React, { useMemo, useState } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  CircleOff,
  Edit3,
  Mic,
  Plus,
  RotateCcw,
  Save,
  Square,
  Trash2,
  Upload,
  Volume2,
  X,
} from 'lucide-react';
import { EventPayload, GuestBookEvent } from '../../types';
import { Button } from '../ui/Button';
import { AudioPlayer } from '../ui/AudioPlayer';
import { getEventAudioUrl } from '../../api/events';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';

interface EventManagerProps {
  events: GuestBookEvent[];
  onCreate: (payload: EventPayload) => Promise<void>;
  onUpdate: (id: string, payload: EventPayload) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onOpenRecordings: (event: GuestBookEvent) => void;
  recordingCounts: Record<string, number>;
  onUploadWelcomeAudio: (id: string, audio: Blob) => Promise<void>;
  onDeleteWelcomeAudio: (id: string) => Promise<void>;
}

interface EventFormState {
  name: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'inactive';
  welcomeMessage: string;
}

function toDateTimeLocal(value: Date | string) {
  const date = typeof value === 'string' ? new Date(value) : value;
  const pad = (n: number) => String(n).padStart(2, '0');
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join('-') + `T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function getDefaultForm(): EventFormState {
  const start = new Date();
  const end = new Date(start.getTime() + 1000 * 60 * 60 * 4);
  return {
    name: '',
    startDate: toDateTimeLocal(start),
    endDate: toDateTimeLocal(end),
    status: 'active',
    welcomeMessage: '',
  };
}

function eventToForm(event: GuestBookEvent): EventFormState {
  return {
    name: event.name,
    startDate: toDateTimeLocal(event.startDate),
    endDate: toDateTimeLocal(event.endDate),
    status: event.status,
    welcomeMessage: event.welcomeMessage || '',
  };
}

function formToPayload(form: EventFormState): EventPayload {
  return {
    name: form.name.trim(),
    startDate: new Date(form.startDate).toISOString(),
    endDate: new Date(form.endDate).toISOString(),
    status: form.status,
    welcomeMessage: form.welcomeMessage.trim(),
  };
}

function formatDate(value: string) {
  return new Date(value).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface WelcomeAudioControlsProps {
  event: GuestBookEvent;
  onUploadWelcomeAudio: (id: string, audio: Blob) => Promise<void>;
  onDeleteWelcomeAudio: (id: string) => Promise<void>;
}

const WelcomeAudioControls: React.FC<WelcomeAudioControlsProps> = ({
  event,
  onUploadWelcomeAudio,
  onDeleteWelcomeAudio,
}) => {
  const recorder = useAudioRecorder();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const existingAudioUrl = getEventAudioUrl(event.welcomeAudioUrl);
  const canSaveRecording = recorder.recorderState === 'stopped' && recorder.audioBlob;

  const handleRecord = async () => {
    setError(null);
    recorder.resetRecording();
    await recorder.startRecording();
  };

  const handleUploadBlob = async (audio: Blob) => {
    setSaving(true);
    setError(null);
    try {
      await onUploadWelcomeAudio(event._id, audio);
      recorder.resetRecording();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save welcome audio.');
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    await handleUploadBlob(file);
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      await onDeleteWelcomeAudio(event._id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete welcome audio.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-yellow-300/10">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <p className="text-sm font-semibold text-white">Audio welcome message</p>
          <p className="text-xs text-zinc-500">
            Guests hear this before their recording starts.
          </p>
        </div>
        <Volume2 size={18} className="text-yellow-300 flex-shrink-0" />
      </div>

      {existingAudioUrl && (
        <div className="mb-3 rounded-2xl bg-black/45 border border-yellow-300/10 p-3">
          <AudioPlayer src={existingAudioUrl} dark />
        </div>
      )}

      {recorder.audioUrl && (
        <div className="mb-3 rounded-2xl bg-yellow-400/10 border border-yellow-300/20 p-3">
          <p className="text-xs font-semibold text-yellow-200 mb-2">
            New recording preview
          </p>
          <AudioPlayer src={recorder.audioUrl} />
        </div>
      )}

      {recorder.errorMessage && (
        <div className="mb-3 px-3 py-2 rounded-xl bg-red-500/15 border border-red-400/30 text-red-200 text-xs">
          {recorder.errorMessage}
        </div>
      )}

      {error && (
        <div className="mb-3 px-3 py-2 rounded-xl bg-red-500/15 border border-red-400/30 text-red-200 text-xs">
          {error}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {recorder.recorderState === 'recording' ? (
          <button
            type="button"
            onClick={recorder.stopRecording}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500 hover:bg-red-400 text-white text-sm font-semibold transition-all"
          >
            <Square size={14} fill="currentColor" />
            Stop
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void handleRecord()}
            disabled={recorder.recorderState === 'requesting' || recorder.recorderState === 'playingWelcome'}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-yellow-400 border border-yellow-300/10 text-zinc-300 hover:text-black text-sm font-semibold transition-all disabled:opacity-50"
          >
            <Mic size={14} />
            {recorder.recorderState === 'requesting' ? 'Requesting…' : 'Record'}
          </button>
        )}

        {canSaveRecording && (
          <button
            type="button"
            onClick={() => recorder.audioBlob && void handleUploadBlob(recorder.audioBlob)}
            disabled={saving}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black text-sm font-semibold transition-all disabled:opacity-50"
          >
            <Save size={14} />
            {saving ? 'Saving…' : 'Save Audio'}
          </button>
        )}

        {recorder.audioUrl && (
          <button
            type="button"
            onClick={recorder.resetRecording}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-yellow-400 border border-yellow-300/10 text-zinc-300 hover:text-black text-sm font-semibold transition-all"
          >
            <RotateCcw size={14} />
            Discard
          </button>
        )}

        <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-yellow-400 border border-yellow-300/10 text-zinc-300 hover:text-black text-sm font-semibold transition-all cursor-pointer">
          <Upload size={14} />
          Upload
          <input
            type="file"
            accept="audio/*"
            onChange={(e) => void handleFileChange(e)}
            className="sr-only"
          />
        </label>

        {existingAudioUrl && (
          <button
            type="button"
            onClick={() => void handleDelete()}
            disabled={deleting}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-red-500/15 border border-yellow-300/10 text-zinc-300 hover:text-red-400 text-sm font-semibold transition-all disabled:opacity-50"
          >
            <Trash2 size={14} />
            {deleting ? 'Removing…' : 'Remove'}
          </button>
        )}
      </div>
    </div>
  );
};

export const EventManager: React.FC<EventManagerProps> = ({
  events,
  onCreate,
  onUpdate,
  onDelete,
  onOpenRecordings,
  recordingCounts,
  onUploadWelcomeAudio,
  onDeleteWelcomeAudio,
}) => {
  const [form, setForm] = useState<EventFormState>(() => getDefaultForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sortedEvents = useMemo(
    () =>
      [...events].sort(
        (a, b) => new Date(b.createdAt || b.startDate).getTime() -
          new Date(a.createdAt || a.startDate).getTime()
      ),
    [events]
  );

  const activeUpcomingCount = events.filter(
    (event) => event.status === 'active' && new Date(event.endDate).getTime() >= Date.now()
  ).length;

  const resetForm = () => {
    setForm(getDefaultForm());
    setEditingId(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.name.trim()) {
      setError('Event name is required.');
      return;
    }

    if (new Date(form.endDate).getTime() < new Date(form.startDate).getTime()) {
      setError('End date must be after the start date.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = formToPayload(form);
      if (editingId) {
        await onUpdate(editingId, payload);
      } else {
        await onCreate(payload);
      }
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save event.');
    } finally {
      setSubmitting(false);
    }
  };

  const startEditing = (event: GuestBookEvent) => {
    setEditingId(event._id);
    setForm(eventToForm(event));
    setError(null);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    setError(null);
    try {
      await onDelete(id);
      if (editingId === id) resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete event.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.25fr)] gap-6">
      <form
        onSubmit={handleSubmit}
        className="bg-zinc-950 border border-yellow-300/15 rounded-2xl p-5 shadow-sm shadow-yellow-400/5"
      >
        <div className="flex items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="text-lg font-bold text-white">
              {editingId ? 'Edit Event' : 'Create Event'}
            </h3>
            <p className="text-sm text-zinc-500">
              Active events appear on the guest screen until their end date.
            </p>
          </div>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="w-9 h-9 rounded-xl bg-zinc-900 hover:bg-yellow-400 border border-yellow-300/10 text-zinc-400 hover:text-black flex items-center justify-center transition-all"
              title="Cancel edit"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="space-y-4">
          <label className="block">
            <span className="block text-sm font-medium text-zinc-300 mb-2">
              Event name
            </span>
            <input
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              maxLength={160}
              className="w-full px-4 py-3 rounded-xl bg-black border border-yellow-300/20 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-yellow-300/40"
              placeholder="Wedding Reception"
            />
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="block text-sm font-medium text-zinc-300 mb-2">
                Start date
              </span>
              <input
                type="datetime-local"
                value={form.startDate}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, startDate: e.target.value }))
                }
                className="w-full px-4 py-3 rounded-xl bg-black border border-yellow-300/20 text-white focus:outline-none focus:ring-2 focus:ring-yellow-300/40"
              />
            </label>

            <label className="block">
              <span className="block text-sm font-medium text-zinc-300 mb-2">
                End date
              </span>
              <input
                type="datetime-local"
                value={form.endDate}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, endDate: e.target.value }))
                }
                className="w-full px-4 py-3 rounded-xl bg-black border border-yellow-300/20 text-white focus:outline-none focus:ring-2 focus:ring-yellow-300/40"
              />
            </label>
          </div>

          <label className="block">
            <span className="block text-sm font-medium text-zinc-300 mb-2">
              Status
            </span>
            <select
              value={form.status}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  status: e.target.value === 'inactive' ? 'inactive' : 'active',
                }))
              }
              className="w-full px-4 py-3 rounded-xl bg-black border border-yellow-300/20 text-white focus:outline-none focus:ring-2 focus:ring-yellow-300/40"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>

          <label className="block">
            <span className="block text-sm font-medium text-zinc-300 mb-2">
              Welcome message
            </span>
            <textarea
              value={form.welcomeMessage}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, welcomeMessage: e.target.value }))
              }
              maxLength={800}
              rows={5}
              className="w-full px-4 py-3 rounded-xl bg-black border border-yellow-300/20 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-yellow-300/40 resize-none"
              placeholder="Welcome! Please leave a short message after this greeting."
            />
          </label>

          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-500/15 border border-red-400/30 text-red-200 text-sm">
              {error}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={submitting}
            icon={editingId ? <Save size={18} /> : <Plus size={18} />}
            className="w-full"
          >
            {editingId ? 'Save Event' : 'Create Event'}
          </Button>
        </div>
      </form>

      <section className="min-w-0">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-lg font-bold text-white">Events</h3>
            <p className="text-sm text-zinc-500">
              {activeUpcomingCount} active event{activeUpcomingCount !== 1 ? 's' : ''} available to guests
            </p>
          </div>
        </div>

        {sortedEvents.length === 0 ? (
          <div className="bg-zinc-950 border border-yellow-300/15 rounded-2xl p-8 text-center">
            <CalendarDays size={34} className="text-yellow-300 mx-auto mb-3" />
            <p className="font-semibold text-white">No events yet</p>
            <p className="text-sm text-zinc-500 mt-1">
              Create an event to make the guest recorder available.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {sortedEvents.map((event) => {
              const ended = new Date(event.endDate).getTime() < Date.now();
              const visibleToGuests = event.status === 'active' && !ended;
              const recordingCount = recordingCounts[event._id] || 0;

              return (
                <article
                  key={event._id}
                  className="bg-zinc-950 border border-yellow-300/15 rounded-2xl p-4 shadow-sm shadow-yellow-400/5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h4 className="font-semibold text-white text-lg truncate">
                          {event.name}
                        </h4>
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${
                            visibleToGuests
                              ? 'bg-yellow-400/15 border-yellow-300/25 text-yellow-300'
                              : 'bg-zinc-900 border-zinc-700 text-zinc-400'
                          }`}
                        >
                          {visibleToGuests ? (
                            <CheckCircle2 size={12} />
                          ) : (
                            <CircleOff size={12} />
                          )}
                          {ended ? 'Ended' : event.status}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-500">
                        {formatDate(event.startDate)} - {formatDate(event.endDate)}
                      </p>
                      {event.welcomeMessage && (
                        <p className="text-sm text-zinc-300 mt-3 line-clamp-2">
                          {event.welcomeMessage}
                        </p>
                      )}
                      <button
                        type="button"
                        onClick={() => onOpenRecordings(event)}
                        className="mt-4 inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-yellow-400/15 hover:bg-yellow-400 border border-yellow-300/20 text-yellow-300 hover:text-black text-sm font-semibold transition-all"
                      >
                        <Mic size={14} />
                        {recordingCount} recording{recordingCount !== 1 ? 's' : ''}
                      </button>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => startEditing(event)}
                        className="w-9 h-9 rounded-xl bg-zinc-900 hover:bg-yellow-400 border border-yellow-300/10 text-zinc-400 hover:text-black flex items-center justify-center transition-all"
                        title="Edit event"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(event._id)}
                        disabled={deletingId === event._id}
                        className="w-9 h-9 rounded-xl bg-zinc-900 hover:bg-red-500/15 border border-yellow-300/10 text-zinc-400 hover:text-red-400 flex items-center justify-center transition-all disabled:opacity-50"
                        title="Delete event"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  <WelcomeAudioControls
                    event={event}
                    onUploadWelcomeAudio={onUploadWelcomeAudio}
                    onDeleteWelcomeAudio={onDeleteWelcomeAudio}
                  />
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
