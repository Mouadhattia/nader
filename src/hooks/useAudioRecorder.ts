import { useState, useRef, useCallback, useEffect } from 'react';

export type RecorderState =
  | 'idle'
  | 'requesting'
  | 'playingWelcome'
  | 'recording'
  | 'stopped'
  | 'error';

interface StartRecordingOptions {
  beforeStart?: () => Promise<void>;
}

interface UseAudioRecorderReturn {
  recorderState: RecorderState;
  audioBlob: Blob | null;
  audioUrl: string | null;
  elapsedSeconds: number;
  errorMessage: string | null;
  startRecording: (options?: StartRecordingOptions) => Promise<void>;
  stopRecording: () => void;
  resetRecording: () => void;
}

const MAX_DURATION_SECONDS = 180; // 3 minutes max

function getBrowserErrorName(err: unknown): string {
  if (err instanceof DOMException) return err.name;
  if (err && typeof err === 'object' && 'name' in err) {
    return String((err as { name?: unknown }).name ?? '');
  }
  return '';
}

function getBrowserErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return '';
}

export function useAudioRecorder(): UseAudioRecorderReturn {
  const [recorderState, setRecorderState] = useState<RecorderState>('idle');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async (options?: StartRecordingOptions) => {
    setErrorMessage(null);
    setRecorderState('requesting');
    chunksRef.current = [];

    try {
      if (!window.isSecureContext) {
        throw new DOMException(
          'Microphone access requires a secure page.',
          'SecurityError'
        );
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new DOMException(
          'This browser does not expose microphone access on this page.',
          'NotSupportedError'
        );
      }

      if (typeof MediaRecorder === 'undefined') {
        throw new DOMException(
          'This browser does not support audio recording.',
          'NotSupportedError'
        );
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Pick best supported MIME type
      const mimeType =
        typeof MediaRecorder.isTypeSupported === 'function'
          ? [
              'audio/webm;codecs=opus',
              'audio/webm',
              'audio/ogg;codecs=opus',
              'audio/mp4',
            ].find((m) => MediaRecorder.isTypeSupported(m)) ?? ''
          : '';

      if (options?.beforeStart) {
        setRecorderState('playingWelcome');
        try {
          await options.beforeStart();
        } catch (beforeStartError) {
          console.warn('Welcome message playback failed:', beforeStartError);
        }
      }

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: mimeType || 'audio/webm',
        });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        setRecorderState('stopped');
        stopStream();
        clearTimer();
      };

      recorder.onerror = () => {
        setErrorMessage('Recording failed. Please try again.');
        setRecorderState('error');
        stopStream();
        clearTimer();
      };

      recorder.start(250); // collect data every 250ms
      setRecorderState('recording');
      setElapsedSeconds(0);

      timerRef.current = setInterval(() => {
        setElapsedSeconds((s) => {
          const next = s + 1;
          if (next >= MAX_DURATION_SECONDS) {
            recorder.stop();
          }
          return next;
        });
      }, 1000);
    } catch (err) {
      const errorName = getBrowserErrorName(err);
      const details = getBrowserErrorMessage(err);

      if (errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError') {
        setErrorMessage(
          'Microphone access was denied. In Chrome, open Site settings for this page and set Microphone to Allow.'
        );
      } else if (errorName === 'NotFoundError' || errorName === 'DevicesNotFoundError') {
        setErrorMessage('No microphone was found on this device.');
      } else if (errorName === 'NotReadableError' || errorName === 'TrackStartError') {
        setErrorMessage(
          'The microphone is already in use or blocked by the operating system.'
        );
      } else if (errorName === 'SecurityError') {
        setErrorMessage(
          'Microphone access needs HTTPS, or localhost on this PC. Phone access over a LAN IP must use HTTPS.'
        );
      } else if (errorName === 'NotSupportedError') {
        setErrorMessage(
          details || 'This browser does not support microphone recording on this page.'
        );
      } else {
        setErrorMessage(
          details
            ? `Could not access microphone: ${details}`
            : 'Could not access microphone. Please check your browser and device settings.'
        );
      }
      setRecorderState('error');
      stopStream();
    }
  }, [stopStream, clearTimer]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && recorderState === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, [recorderState]);

  const resetRecording = useCallback(() => {
    clearTimer();
    stopStream();

    if (mediaRecorderRef.current) {
      if (mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      mediaRecorderRef.current = null;
    }

    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }

    chunksRef.current = [];
    setAudioBlob(null);
    setAudioUrl(null);
    setElapsedSeconds(0);
    setErrorMessage(null);
    setRecorderState('idle');
  }, [clearTimer, stopStream, audioUrl]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimer();
      stopStream();
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    recorderState,
    audioBlob,
    audioUrl,
    elapsedSeconds,
    errorMessage,
    startRecording,
    stopRecording,
    resetRecording,
  };
}
