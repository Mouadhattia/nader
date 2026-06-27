import axios, { AxiosError } from 'axios';
import { Recording, UploadPayload } from '../types';
import { MOCK_RECORDINGS } from './mockData';

const getDefaultApiUrl = () => {
  if (typeof window === 'undefined') return 'http://localhost:5000';
  if (window.location.port === '3000' || window.location.port === '5173') {
    return `${window.location.protocol}//${window.location.hostname}:5000`;
  }
  return window.location.origin;
};

const BASE_URL = import.meta.env.VITE_API_URL || getDefaultApiUrl();

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

// ─── In-memory mock store (demo mode when backend is offline) ─────────────────
let mockStore: Recording[] = [...MOCK_RECORDINGS];
let useMockMode = false;

function isMockMode(): boolean {
  return useMockMode;
}

function enableMockMode() {
  if (!useMockMode) {
    console.warn(
      '[AudioGuestBook] Backend unreachable — switching to demo mode.\n' +
        'Start the backend at http://localhost:5000 for full functionality.'
    );
    useMockMode = true;
  }
}

function disableMockMode() {
  if (useMockMode) {
    console.info('[AudioGuestBook] Backend reachable — returning to live mode.');
    useMockMode = false;
  }
}

function isNetworkError(err: unknown): boolean {
  if (err instanceof AxiosError) {
    return (
      err.code === 'ERR_NETWORK' ||
      err.code === 'ECONNREFUSED' ||
      err.message === 'Network Error' ||
      (err.response?.status ?? 0) === 0
    );
  }
  return false;
}

// ─── Upload ───────────────────────────────────────────────────────────────────

export const uploadRecording = async (payload: UploadPayload): Promise<Recording> => {
  if (isMockMode()) {
    // Simulate upload delay
    await new Promise((r) => setTimeout(r, 1200));
    const mock: Recording = {
      _id: `mock-${Date.now()}`,
      guestName: payload.guestName || 'Anonymous Guest',
      eventName: payload.eventName,
      eventId: payload.eventId || null,
      audioUrl: URL.createObjectURL(payload.audio),
      fileName: `recording-${Date.now()}.webm`,
      duration: payload.duration,
      createdAt: new Date().toISOString(),
    };
    mockStore = [mock, ...mockStore];
    return mock;
  }

  try {
    const formData = new FormData();
    formData.append('audio', payload.audio, `recording-${Date.now()}.webm`);
    formData.append('guestName', payload.guestName);
    formData.append('eventName', payload.eventName);
    if (payload.eventId) formData.append('eventId', payload.eventId);
    formData.append('duration', String(payload.duration));

    const response = await api.post<{ success: boolean; data: Recording }>(
      '/api/recordings/upload',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data.data;
  } catch (err) {
    if (isNetworkError(err)) {
      enableMockMode();
      return uploadRecording(payload);
    }
    throw new Error(
      err instanceof AxiosError
        ? err.response?.data?.message || err.message
        : 'Upload failed'
    );
  }
};

// ─── Fetch All ────────────────────────────────────────────────────────────────

export const fetchRecordings = async (): Promise<Recording[]> => {
  try {
    const response = await api.get<{ success: boolean; data: Recording[] }>(
      '/api/recordings'
    );
    disableMockMode();
    return response.data.data;
  } catch (err) {
    if (isNetworkError(err)) {
      enableMockMode();
      await new Promise((r) => setTimeout(r, 600));
      return [...mockStore];
    }
    throw new Error(
      err instanceof AxiosError
        ? err.response?.data?.message || err.message
        : 'Failed to fetch recordings'
    );
  }
};

// ─── Delete ───────────────────────────────────────────────────────────────────

export const deleteRecording = async (id: string): Promise<void> => {
  if (isMockMode()) {
    await new Promise((r) => setTimeout(r, 500));
    mockStore = mockStore.filter((r) => r._id !== id);
    return;
  }

  try {
    await api.delete(`/api/recordings/${id}`);
  } catch (err) {
    if (isNetworkError(err)) {
      enableMockMode();
      return deleteRecording(id);
    }
    throw new Error(
      err instanceof AxiosError
        ? err.response?.data?.message || err.message
        : 'Failed to delete recording'
    );
  }
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const getAudioUrl = (audioUrl: string): string => {
  if (!audioUrl) return '';
  if (audioUrl.startsWith('blob:') || audioUrl.startsWith('http')) return audioUrl;
  return `${BASE_URL}${audioUrl}`;
};

export { isMockMode };
