import React, { useState, useCallback, useEffect, useRef } from 'react';
import { EventSelectStep } from '../components/guest/EventSelectStep';
import { WelcomeStep } from '../components/guest/WelcomeStep';
import { RecordingStep } from '../components/guest/RecordingStep';
import { SavingStep } from '../components/guest/SavingStep';
import { uploadRecording } from '../api/recordings';
import { fetchActiveEvents, getEventAudioUrl } from '../api/events';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { useRemoteRecordingTrigger } from '../hooks/useRemoteRecordingTrigger';
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
  const guestName = '';
  const [recordingData, setRecordingData] = useState<RecordingData | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  const recorder = useAudioRecorder();

  // Guards against the auto-save firing twice for one recording (the effect in
  // RecordingStep can re-run before the step change unmounts it).
  const savingRef = useRef(false);

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
    setRecordingData(null);
    setSaveError(null);
    savingRef.current = false;
    recorder.resetRecording();
    setStep('welcome');
  }, [recorder]);

  const startRecordingFor = useCallback(async (event: GuestBookEvent) => {
    recorder.resetRecording();
    setRecordingData(null);
    setSaveError(null);
    setJustSaved(false);
    savingRef.current = false;
    setStep('recording');
    await recorder.startRecording({
      beforeStart: () => playEventWelcome(event),
    });
  }, [playEventWelcome, recorder]);

  /**
   * Back to the start-recording screen for the same event, ready for the next
   * guest. Only falls back to the event list if no event is selected.
   */
  const returnToStart = useCallback(() => {
    recorder.resetRecording();
    setRecordingData(null);
    setSaveError(null);
    savingRef.current = false;

    if (selectedEvent) {
      setStep('welcome');
      return;
    }

    setStep('eventSelect');
    loadEvents();
  }, [recorder, selectedEvent, loadEvents]);

  const handleStart = useCallback(async () => {
    if (!selectedEvent) {
      setStep('eventSelect');
      return;
    }
    await startRecordingFor(selectedEvent);
  }, [selectedEvent, startRecordingFor]);

  const handleRemoteStart = useCallback(() => {
    // Already busy — ignore the press instead of clobbering a live recording
    // or an in-flight upload.
    if (step === 'recording' || step === 'saving') return;

    // The event stays selected between guests, so a press starts a fresh
    // recording from the welcome screen *or* from the thank-you screen if the
    // next guest picks up the phone before it auto-resets.
    if (selectedEvent) {
      void startRecordingFor(selectedEvent);
      return;
    }

    // Nobody has picked an event yet. If there's exactly one active event,
    // the phone button alone is enough to start.
    if (events.length === 1) {
      const event = events[0];
      setSelectedEvent(event);
      void startRecordingFor(event);
    }
  }, [step, selectedEvent, events, startRecordingFor]);

  const handleRemoteStop = useCallback(() => {
    if (step === 'recording') {
      recorder.stopRecording();
    }
  }, [step, recorder]);

  useRemoteRecordingTrigger({
    onRemoteStart: handleRemoteStart,
    onRemoteStop: handleRemoteStop,
  });

  const saveRecording = useCallback(
    async (data: RecordingData, event: GuestBookEvent) => {
      setSaveError(null);
      try {
        await uploadRecording({
          audio: data.blob,
          guestName: guestName || 'Anonymous Guest',
          eventName: event.name,
          eventId: event._id,
          duration: data.duration,
        });
        // Straight back to the start screen — no confirmation page, no taps.
        setJustSaved(true);
        returnToStart();
      } catch (err) {
        setSaveError(
          err instanceof Error ? err.message : 'Failed to save your message.'
        );
      }
    },
    [guestName, returnToStart]
  );

  // Stopping the recording saves it immediately — the guest never confirms.
  const handleRecordingFinished = useCallback(
    (blob: Blob, url: string, duration: number) => {
      if (savingRef.current) return;
      savingRef.current = true;

      const data = { blob, url, duration };
      setRecordingData(data);
      setStep('saving');

      if (!selectedEvent) {
        setSaveError('No event selected.');
        return;
      }
      if (blob.size === 0) {
        setSaveError('Nothing was recorded. Please try again.');
        return;
      }

      void saveRecording(data, selectedEvent);
    },
    [selectedEvent, saveRecording]
  );

  const handleRetrySave = useCallback(() => {
    if (!selectedEvent) {
      setStep('eventSelect');
      return;
    }
    // Nothing usable to upload — start a fresh recording instead.
    if (!recordingData || recordingData.blob.size === 0) {
      void startRecordingFor(selectedEvent);
      return;
    }
    setSaveError(null);
    void saveRecording(recordingData, selectedEvent);
  }, [recordingData, selectedEvent, saveRecording, startRecordingFor]);

  // Clear the "saved" confirmation chip on the start screen after a moment.
  useEffect(() => {
    if (!justSaved) return;
    const timer = window.setTimeout(() => setJustSaved(false), 5000);
    return () => window.clearTimeout(timer);
  }, [justSaved]);

  const handleCancelRecording = useCallback(() => {
    recorder.resetRecording();
    savingRef.current = false;
    setStep('welcome');
  }, [recorder]);

  const handleChangeEvent = useCallback(() => {
    recorder.resetRecording();
    setSelectedEvent(null);
    setRecordingData(null);
    setSaveError(null);
    savingRef.current = false;
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
            savedNotice={justSaved}
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

        {step === 'saving' && (
          <SavingStep
            errorMessage={saveError}
            onRetry={handleRetrySave}
            onStartOver={returnToStart}
          />
        )}
      </div>
    </div>
  );
};
