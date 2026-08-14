import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const getDefaultApiUrl = () => {
  if (typeof window === 'undefined') return 'http://localhost:5000';
  if (window.location.port === '3000' || window.location.port === '5173') {
    return `${window.location.protocol}//${window.location.hostname}:5000`;
  }
  return window.location.origin;
};

const BASE_URL = import.meta.env.VITE_API_URL || getDefaultApiUrl();

let sharedSocket: Socket | null = null;

function getSocket(): Socket {
  if (!sharedSocket) {
    sharedSocket = io(BASE_URL, { reconnection: true });
  }
  return sharedSocket;
}

interface UseRemoteRecordingTriggerOptions {
  onRemoteStart: () => void;
  onRemoteStop: () => void;
}

/**
 * Listens for `remote:start_recording` / `remote:stop_recording` events
 * relayed by the backend from the Raspberry Pi phone-button client, and
 * invokes the given callbacks. Always calls the latest callback passed in,
 * even though the socket listener is only attached once.
 */
export function useRemoteRecordingTrigger({
  onRemoteStart,
  onRemoteStop,
}: UseRemoteRecordingTriggerOptions): void {
  const startRef = useRef(onRemoteStart);
  const stopRef = useRef(onRemoteStop);
  startRef.current = onRemoteStart;
  stopRef.current = onRemoteStop;

  useEffect(() => {
    const socket = getSocket();
    const handleStart = () => startRef.current();
    const handleStop = () => stopRef.current();

    socket.on('remote:start_recording', handleStart);
    socket.on('remote:stop_recording', handleStop);

    return () => {
      socket.off('remote:start_recording', handleStart);
      socket.off('remote:stop_recording', handleStop);
    };
  }, []);
}
