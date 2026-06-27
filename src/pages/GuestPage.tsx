import React, { useState, useCallback, useEffect } from 'react';
import { EventSelectStep } from '../components/guest/EventSelectStep';
import { WelcomeStep } from '../components/guest/WelcomeStep';
import { RecordingStep } from '../components/guest/RecordingStep';
import { PreviewStep } from '../components/guest/PreviewStep';
import { SuccessStep } from '../components/guest/SuccessStep';
import { uploadRecording } from '../api/recordings';
import { fetchActiveEvents, getEventAudioUrl } from '../api/events';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { GuestBookEvent, RecordingStep as Step } from '../types';

interface RecordingData {
  blob: Blob;
  url: string;
  duration: number;
}

export const GuestPage: React.FC = () => {
  const [step, setStep] = useState<Step>('eventSelect');
  const [events, setEvents] = useState<GuestBookEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<GuestBookEvent | null>(null);
  const [guestName, setGuestName] = useState('');
  const [recordingData, setRecordingData] = useState<RecordingData | null>(null);
  const recorder = useAudioRecorder();

  const loadEvents = useCallback(async () => {
    setEventsLoading(true);
    setEventsError(null);
    try {
      const data = await fetchActiveEvents();
      setEvents(data);
    } catch (err) {
      setEventsError(err instanceof Error ? err.message : 'Failed to load events.');
    } finally {
      setEventsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const playWelcomeAudio = useCallback((audioUrl: string) => {
    if (!audioUrl) return Promise.resolve();

    return new Promise<void>((resolve) => {
      const audio = new Audio(audioUrl);
      let settled = false;

      const finish = () => {
        if (settled) return;
        settled = true;
        audio.pause();
        audio.removeAttribute('src');
        audio.load();
        resolve();
      };

      audio.onended = finish;
      audio.onerror = finish;
      audio.play().catch(finish);

      window.setTimeout(finish, 1000 * 60 * 5);
    });
  }, []);

  const playEventWelcome = useCallback(
    (event: GuestBookEvent) => {
      const audioUrl = getEventAudioUrl(event.welcomeAudioUrl);
      return playWelcomeAudio(audioUrl);
    },
    [playWelcomeAudio]
  );

  const handleSelectEvent = useCallback((event: GuestBookEvent) => {
    setSelectedEvent(event);
    setGuestName('');
    setRecordingData(null);
    recorder.resetRecording();
    setStep('welcome');
  }, [recorder]);

  const handleStart = useCallback(async (name: string) => {
    if (!selectedEvent) {
      setStep('eventSelect');
      return;
    }

    recorder.resetRecording();
    setGuestName(name);
    setRecordingData(null);
    setStep('recording');
    await recorder.startRecording({
      beforeStart: () => playEventWelcome(selectedEvent),
    });
  }, [playEventWelcome, recorder, selectedEvent]);

  const handleRecordingFinished = useCallback(
    (blob: Blob, url: string, duration: number) => {
      setRecordingData({ blob, url, duration });
      setStep('preview');
    },
    []
  );

  const handleSave = useCallback(async () => {
    if (!recordingData) throw new Error('No recording data');
    if (!selectedEvent) throw new Error('No event selected');

    await uploadRecording({
      audio: recordingData.blob,
      guestName: guestName || 'Anonymous Guest',
      eventName: selectedEvent.name,
      eventId: selectedEvent._id,
      duration: recordingData.duration,
    });

    setStep('success');
  }, [recordingData, guestName, selectedEvent]);

  const handleRecordAgain = useCallback(async () => {
    if (!selectedEvent) {
      setStep('eventSelect');
      return;
    }

    recorder.resetRecording();
    setRecordingData(null);
    setStep('recording');
    await recorder.startRecording({
      beforeStart: () => playEventWelcome(selectedEvent),
    });
  }, [playEventWelcome, recorder, selectedEvent]);

  const handleNextGuest = useCallback(() => {
    recorder.resetRecording();
    setSelectedEvent(null);
    setGuestName('');
    setRecordingData(null);
    setStep('eventSelect');
    loadEvents();
  }, [loadEvents, recorder]);

  const handleCancelRecording = useCallback(() => {
    recorder.resetRecording();
    setStep('welcome');
  }, [recorder]);

  const handleChangeEvent = useCallback(() => {
    recorder.resetRecording();
    setSelectedEvent(null);
    setRecordingData(null);
    setStep('eventSelect');
    loadEvents();
  }, [loadEvents, recorder]);

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{
        backgroundImage: 'url(/images/hero-bg.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/75 backdrop-blur-[2px]" />

      {/* Gradient overlays for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-yellow-950/20 to-black/90" />

      {/* Content */}
      <div className="relative z-10">
        {step === 'eventSelect' && (
          <EventSelectStep
            events={events}
            loading={eventsLoading}
            error={eventsError}
            onSelect={handleSelectEvent}
            onRefresh={loadEvents}
          />
        )}

        {step === 'welcome' && (
          <WelcomeStep
            eventName={selectedEvent?.name || ''}
            welcomeMessage={selectedEvent?.welcomeMessage}
            welcomeAudioUrl={getEventAudioUrl(selectedEvent?.welcomeAudioUrl)}
            onStart={handleStart}
            onBack={handleChangeEvent}
          />
        )}

        {step === 'recording' && (
          <RecordingStep
            guestName={guestName}
            recorderState={recorder.recorderState}
            audioBlob={recorder.audioBlob}
            audioUrl={recorder.audioUrl}
            elapsedSeconds={recorder.elapsedSeconds}
            errorMessage={recorder.errorMessage}
            startRecording={recorder.startRecording}
            stopRecording={recorder.stopRecording}
            resetRecording={recorder.resetRecording}
            onFinished={handleRecordingFinished}
            onCancel={handleCancelRecording}
          />
        )}

        {step === 'preview' && recordingData && (
          <PreviewStep
            audioUrl={recordingData.url}
            audioBlob={recordingData.blob}
            guestName={guestName}
            eventName={selectedEvent?.name || ''}
            duration={recordingData.duration}
            onSave={handleSave}
            onRecordAgain={handleRecordAgain}
          />
        )}

        {step === 'success' && (
          <SuccessStep
            guestName={guestName}
            onNextGuest={handleNextGuest}
          />
        )}
      </div>
    </div>
  );
};
