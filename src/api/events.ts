import axios, { AxiosError } from 'axios';
import { EventPayload, GuestBookEvent } from '../types';
import { MOCK_EVENTS } from './mockData';

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

let mockEvents: GuestBookEvent[] = [...MOCK_EVENTS];
let useMockMode = false;

function enableMockMode() {
  if (!useMockMode) {
    console.warn('[AudioGuestBook] Events backend unreachable - using demo events.');
    useMockMode = true;
  }
}

function disableMockMode() {
  useMockMode = false;
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

function activeNotEnded(events: GuestBookEvent[]) {
  const now = Date.now();
  return events
    .filter((event) => event.status === 'active' && new Date(event.endDate).getTime() >= now)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
}

export const fetchEvents = async (): Promise<GuestBookEvent[]> => {
  try {
    const response = await api.get<{ success: boolean; data: GuestBookEvent[] }>(
      '/api/events'
    );
    disableMockMode();
    return response.data.data;
  } catch (err) {
    if (isNetworkError(err)) {
      enableMockMode();
      await new Promise((r) => setTimeout(r, 500));
      return [...mockEvents];
    }
    throw new Error(
      err instanceof AxiosError
        ? err.response?.data?.message || err.message
        : 'Failed to fetch events'
    );
  }
};

export const fetchActiveEvents = async (): Promise<GuestBookEvent[]> => {
  try {
    const response = await api.get<{ success: boolean; data: GuestBookEvent[] }>(
      '/api/events/active'
    );
    disableMockMode();
    return response.data.data;
  } catch (err) {
    if (isNetworkError(err)) {
      enableMockMode();
      await new Promise((r) => setTimeout(r, 500));
      return activeNotEnded(mockEvents);
    }
    throw new Error(
      err instanceof AxiosError
        ? err.response?.data?.message || err.message
        : 'Failed to fetch active events'
    );
  }
};

export const createEvent = async (payload: EventPayload): Promise<GuestBookEvent> => {
  if (useMockMode) {
    await new Promise((r) => setTimeout(r, 500));
    const event: GuestBookEvent = {
      _id: `event-mock-${Date.now()}`,
      ...payload,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockEvents = [event, ...mockEvents];
    return event;
  }

  try {
    const response = await api.post<{ success: boolean; data: GuestBookEvent }>(
      '/api/events',
      payload
    );
    return response.data.data;
  } catch (err) {
    if (isNetworkError(err)) {
      enableMockMode();
      return createEvent(payload);
    }
    throw new Error(
      err instanceof AxiosError
        ? err.response?.data?.message || err.message
        : 'Failed to create event'
    );
  }
};

export const updateEvent = async (
  id: string,
  payload: EventPayload
): Promise<GuestBookEvent> => {
  if (useMockMode) {
    await new Promise((r) => setTimeout(r, 500));
    mockEvents = mockEvents.map((event) =>
      event._id === id
        ? { ...event, ...payload, updatedAt: new Date().toISOString() }
        : event
    );
    const event = mockEvents.find((item) => item._id === id);
    if (!event) throw new Error('Event not found');
    return event;
  }

  try {
    const response = await api.patch<{ success: boolean; data: GuestBookEvent }>(
      `/api/events/${id}`,
      payload
    );
    return response.data.data;
  } catch (err) {
    if (isNetworkError(err)) {
      enableMockMode();
      return updateEvent(id, payload);
    }
    throw new Error(
      err instanceof AxiosError
        ? err.response?.data?.message || err.message
        : 'Failed to update event'
    );
  }
};

export const deleteEvent = async (id: string): Promise<void> => {
  if (useMockMode) {
    await new Promise((r) => setTimeout(r, 400));
    mockEvents = mockEvents.filter((event) => event._id !== id);
    return;
  }

  try {
    await api.delete(`/api/events/${id}`);
  } catch (err) {
    if (isNetworkError(err)) {
      enableMockMode();
      return deleteEvent(id);
    }
    throw new Error(
      err instanceof AxiosError
        ? err.response?.data?.message || err.message
        : 'Failed to delete event'
    );
  }
};

export const uploadEventWelcomeAudio = async (
  id: string,
  audio: Blob
): Promise<GuestBookEvent> => {
  if (useMockMode) {
    await new Promise((r) => setTimeout(r, 600));
    const audioUrl = URL.createObjectURL(audio);
    mockEvents = mockEvents.map((event) =>
      event._id === id
        ? {
            ...event,
            welcomeAudioUrl: audioUrl,
            welcomeAudioFileName: `welcome-${Date.now()}.webm`,
            updatedAt: new Date().toISOString(),
          }
        : event
    );
    const event = mockEvents.find((item) => item._id === id);
    if (!event) throw new Error('Event not found');
    return event;
  }

  try {
    const formData = new FormData();
    formData.append('audio', audio, `welcome-${Date.now()}.webm`);
    const response = await api.post<{ success: boolean; data: GuestBookEvent }>(
      `/api/events/${id}/welcome-audio`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data.data;
  } catch (err) {
    if (isNetworkError(err)) {
      enableMockMode();
      return uploadEventWelcomeAudio(id, audio);
    }
    throw new Error(
      err instanceof AxiosError
        ? err.response?.data?.message || err.message
        : 'Failed to upload welcome audio'
    );
  }
};

export const deleteEventWelcomeAudio = async (id: string): Promise<GuestBookEvent> => {
  if (useMockMode) {
    await new Promise((r) => setTimeout(r, 400));
    mockEvents = mockEvents.map((event) =>
      event._id === id
        ? {
            ...event,
            welcomeAudioUrl: '',
            welcomeAudioFileName: '',
            updatedAt: new Date().toISOString(),
          }
        : event
    );
    const event = mockEvents.find((item) => item._id === id);
    if (!event) throw new Error('Event not found');
    return event;
  }

  try {
    const response = await api.delete<{ success: boolean; data: GuestBookEvent }>(
      `/api/events/${id}/welcome-audio`
    );
    return response.data.data;
  } catch (err) {
    if (isNetworkError(err)) {
      enableMockMode();
      return deleteEventWelcomeAudio(id);
    }
    throw new Error(
      err instanceof AxiosError
        ? err.response?.data?.message || err.message
        : 'Failed to delete welcome audio'
    );
  }
};

export const getEventAudioUrl = (audioUrl?: string): string => {
  if (!audioUrl) return '';
  if (audioUrl.startsWith('blob:') || audioUrl.startsWith('http')) return audioUrl;
  return `${BASE_URL}${audioUrl}`;
};
