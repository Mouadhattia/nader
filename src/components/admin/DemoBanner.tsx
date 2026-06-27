import React from 'react';
import { AlertTriangle } from 'lucide-react';

export const DemoBanner: React.FC = () => (
  <div className="bg-yellow-400/10 border border-yellow-300/25 rounded-2xl p-4 mb-6 flex items-start gap-3">
    <AlertTriangle size={20} className="text-yellow-300 flex-shrink-0 mt-0.5" />
    <div className="text-sm">
      <p className="font-semibold text-yellow-200 mb-0.5">Demo Mode — Backend Offline</p>
      <p className="text-yellow-100/80">
        The backend server isn't running. Showing sample data. Start the backend with{' '}
        <code className="bg-black/40 border border-yellow-300/20 px-1.5 py-0.5 rounded text-xs font-mono text-yellow-200">
          cd backend && npm install && npm start
        </code>{' '}
        for full functionality.
      </p>
    </div>
  </div>
);
