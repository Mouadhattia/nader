export interface Recording {
  _id: string;
  guestName: string;
  eventName: string;
  eventId?: string | null;
  audioUrl: string;
  fileName: string;
  duration: number;
  createdAt: string;
}

export interface UploadPayload {
  audio: Blob;
  guestName: string;
  eventName: string;
  eventId?: string;
  duration: number;
}

export type EventStatus = 'active' | 'inactive';

export interface GuestBookEvent {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: EventStatus;
  welcomeMessage: string;
  welcomeAudioUrl?: string;
  welcomeAudioFileName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface EventPayload {
  name: string;
  startDate: string;
  endDate: string;
  status: EventStatus;
  welcomeMessage: string;
}

export type RecordingStep =
  | 'eventSelect'
  | 'welcome'
  | 'recording'
  | 'preview'
  | 'success';
