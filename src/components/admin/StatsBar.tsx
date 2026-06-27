import React from 'react';
import { Mic, Clock, Users } from 'lucide-react';
import { Recording } from '../../types';

interface StatsBarProps {
  recordings: Recording[];
}

export const StatsBar: React.FC<StatsBarProps> = ({ recordings }) => {
  const totalDuration = recordings.reduce((sum, r) => sum + (r.duration || 0), 0);
  const uniqueGuests = new Set(recordings.map((r) => r.guestName)).size;

  const formatTotal = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
  };

  const stats = [
    {
      label: 'Total Recordings',
      value: recordings.length,
      icon: Mic,
      color: 'bg-yellow-400 text-black',
    },
    {
      label: 'Total Duration',
      value: formatTotal(totalDuration),
      icon: Clock,
      color: 'bg-zinc-900 text-yellow-300 border border-yellow-300/20',
    },
    {
      label: 'Unique Guests',
      value: uniqueGuests,
      icon: Users,
      color: 'bg-yellow-300 text-black',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-zinc-950 rounded-2xl p-5 border border-yellow-300/15 shadow-sm shadow-yellow-400/5 flex items-center gap-4"
        >
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${stat.color}`}>
            <stat.icon size={20} />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-sm text-zinc-500">{stat.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
