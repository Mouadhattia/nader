import React, { useState } from 'react';
import { User, Calendar, Clock, Download, Trash2, Music } from 'lucide-react';
import { format } from 'date-fns';
import { Recording } from '../../types';
import { AudioPlayer } from '../ui/AudioPlayer';
import { getAudioUrl } from '../../api/recordings';

interface RecordingCardProps {
  recording: Recording;
  index: number;
  onDelete: (id: string) => void;
}

export const RecordingCard: React.FC<RecordingCardProps> = ({
  recording,
  index,
  onDelete,
}) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const audioUrl = getAudioUrl(recording.audioUrl);

  const formatDuration = (s: number) => {
    if (!s) return '—';
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }
    setIsDeleting(true);
    try {
      await onDelete(recording._id);
    } finally {
      setIsDeleting(false);
      setConfirmDelete(false);
    }
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = recording.fileName || `recording-${recording._id}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div
      className="bg-zinc-950 rounded-2xl shadow-sm shadow-yellow-400/5 border border-yellow-300/15 p-5 transition-all hover:border-yellow-300/35"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Avatar + Info */}
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-yellow-400 flex items-center justify-center flex-shrink-0">
            <Music size={22} className="text-black" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="font-semibold text-white text-lg truncate">
                {recording.guestName || 'Anonymous Guest'}
              </h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-400/15 border border-yellow-300/20 text-yellow-300 font-medium">
                #{String(index + 1).padStart(2, '0')}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-500">
              <span className="flex items-center gap-1">
                <User size={13} />
                {recording.eventName || '—'}
              </span>
              <span className="flex items-center gap-1">
                <Calendar size={13} />
                {format(new Date(recording.createdAt), 'MMM d, yyyy • h:mm a')}
              </span>
              <span className="flex items-center gap-1">
                <Clock size={13} />
                {formatDuration(recording.duration)}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleDownload}
            title="Download"
            className="w-9 h-9 rounded-xl bg-zinc-900 hover:bg-yellow-400 border border-yellow-300/10 text-zinc-400 hover:text-black flex items-center justify-center transition-all"
          >
            <Download size={16} />
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            title={confirmDelete ? 'Click again to confirm' : 'Delete'}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
              confirmDelete
                ? 'bg-red-100 text-red-600 ring-2 ring-red-300'
                : 'bg-zinc-900 hover:bg-red-500/15 border border-yellow-300/10 text-zinc-400 hover:text-red-400'
            } disabled:opacity-50`}
          >
            {isDeleting ? (
              <svg
                className="animate-spin h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            ) : (
              <Trash2 size={16} />
            )}
          </button>
        </div>
      </div>

      {/* Audio Player */}
      <div className="mt-4 pt-4 border-t border-yellow-300/10">
        <AudioPlayer src={audioUrl} dark />
      </div>

      {confirmDelete && (
        <p className="mt-2 text-xs text-red-500 text-center">
          Click delete again to confirm removal
        </p>
      )}
    </div>
  );
};
