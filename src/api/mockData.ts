import { GuestBookEvent, Recording } from '../types';

const now = Date.now();

export const MOCK_EVENTS: GuestBookEvent[] = [
  {
    _id: 'event-mock-001',
    name: 'Our Special Event',
    startDate: new Date(now - 1000 * 60 * 60).toISOString(),
    endDate: new Date(now + 1000 * 60 * 60 * 24).toISOString(),
    status: 'active',
    welcomeMessage:
      'Welcome. Take a breath, smile, and leave a message for the hosts.',
    welcomeAudioUrl: '',
    welcomeAudioFileName: '',
    createdAt: new Date(now - 1000 * 60 * 90).toISOString(),
    updatedAt: new Date(now - 1000 * 60 * 90).toISOString(),
  },
  {
    _id: 'event-mock-002',
    name: 'Evening Reception',
    startDate: new Date(now + 1000 * 60 * 60 * 2).toISOString(),
    endDate: new Date(now + 1000 * 60 * 60 * 30).toISOString(),
    status: 'active',
    welcomeMessage:
      'Thanks for joining the celebration. Please share your favorite memory or a wish for the future.',
    welcomeAudioUrl: '',
    welcomeAudioFileName: '',
    createdAt: new Date(now - 1000 * 60 * 45).toISOString(),
    updatedAt: new Date(now - 1000 * 60 * 45).toISOString(),
  },
];

// Sample mock recordings for demo mode (when backend is unavailable)
export const MOCK_RECORDINGS: Recording[] = [
  {
    _id: 'mock-001',
    guestName: 'Sarah & Michael',
    eventId: 'event-mock-001',
    eventName: 'Our Special Event',
    audioUrl: '',
    fileName: 'recording-demo-001.webm',
    duration: 47,
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    _id: 'mock-002',
    guestName: 'Grandma Rose',
    eventId: 'event-mock-001',
    eventName: 'Our Special Event',
    audioUrl: '',
    fileName: 'recording-demo-002.webm',
    duration: 93,
    createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
  },
  {
    _id: 'mock-003',
    guestName: 'The Johnson Family',
    eventId: 'event-mock-001',
    eventName: 'Our Special Event',
    audioUrl: '',
    fileName: 'recording-demo-003.webm',
    duration: 32,
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    _id: 'mock-004',
    guestName: 'Anonymous Guest',
    eventId: 'event-mock-001',
    eventName: 'Our Special Event',
    audioUrl: '',
    fileName: 'recording-demo-004.webm',
    duration: 61,
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
  {
    _id: 'mock-005',
    guestName: 'Uncle Dave',
    eventId: 'event-mock-001',
    eventName: 'Our Special Event',
    audioUrl: '',
    fileName: 'recording-demo-005.webm',
    duration: 28,
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
  },
];
