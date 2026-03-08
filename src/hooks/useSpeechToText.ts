import { useState, useCallback, useRef, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { SpeechToText } from '@/plugins/SpeechToTextPlugin';
import { useLanguage } from '@/i18n/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import type { PluginListenerHandle } from '@capacitor/core';

interface UseSpeechToTextOptions {
  onResult?: (text: string) => void;
  onPartialResult?: (text: string) => void;
}

const LOCALE_MAP: Record<string, string> = {
  en: 'en-US',
  ar: 'ar-SA',
};

export function useSpeechToText(options: UseSpeechToTextOptions = {}) {
  const { onResult, onPartialResult } = options;
  const { language, t } = useLanguage();
  const { toast } = useToast();
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const listenersRef = useRef<PluginListenerHandle[]>([]);
  const webRecognizerRef = useRef<SpeechRecognition | null>(null);
  const onResultRef = useRef(onResult);
  const onPartialResultRef = useRef(onPartialResult);

  onResultRef.current = onResult;
  onPartialResultRef.current = onPartialResult;

  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    if (isNative) {
      SpeechToText.isAvailable().then(({ available }) => {
        setIsSupported(available);
      }).catch(() => setIsSupported(false));
    } else {
      const hasWebSpeech = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
      setIsSupported(hasWebSpeech);
    }
  }, [isNative]);

  const cleanupListeners = useCallback(async () => {
    for (const handle of listenersRef.current) {
      try { await handle.remove(); } catch { /* ignore */ }
    }
    listenersRef.current = [];
  }, []);

  const stopListening = useCallback(async () => {
    if (isNative) {
      try { await SpeechToText.stopListening(); } catch { /* ignore */ }
      await cleanupListeners();
    } else if (webRecognizerRef.current) {
      webRecognizerRef.current.stop();
      webRecognizerRef.current = null;
    }
    setIsListening(false);
  }, [isNative, cleanupListeners]);

  const showError = useCallback((errorCode: string) => {
    const messages: Record<string, string> = {
      no_match: t('voice.noSpeechDetected'),
      speech_timeout: t('voice.noSpeechDetected'),
      permission_denied: t('voice.micPermissionDenied'),
      network_error: t('voice.recognitionFailed'),
      audio_error: t('voice.recognitionFailed'),
      recognition_error: t('voice.recognitionFailed'),
    };
    toast({
      title: messages[errorCode] || t('voice.recognitionFailed'),
      variant: 'destructive',
    });
  }, [t, toast]);

  const startListeningNative = useCallback(async () => {
    try {
      const permResult = await SpeechToText.checkPermissions();
      if (permResult.microphone !== 'granted') {
        const reqResult = await SpeechToText.requestPermissions();
        if (reqResult.microphone !== 'granted') {
          showError('permission_denied');
          return;
        }
      }

      await cleanupListeners();

      const resultHandle = await SpeechToText.addListener('speechResult', (data) => {
        if (data.isFinal) {
          onResultRef.current?.(data.text);
          setIsListening(false);
          cleanupListeners();
        } else {
          onPartialResultRef.current?.(data.text);
        }
      });

      const errorHandle = await SpeechToText.addListener('speechError', (data) => {
        showError(data.error);
        setIsListening(false);
        cleanupListeners();
      });

      listenersRef.current = [resultHandle, errorHandle];

      const locale = LOCALE_MAP[language] || 'en-US';
      await SpeechToText.startListening({ locale });
      setIsListening(true);
    } catch {
      showError('recognition_error');
      setIsListening(false);
    }
  }, [language, cleanupListeners, showError]);

  const startListeningWeb = useCallback(() => {
    const SpeechRecognitionClass = (window as unknown as { webkitSpeechRecognition?: typeof SpeechRecognition; SpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition || window.SpeechRecognition;
    if (!SpeechRecognitionClass) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognitionClass();
    recognition.lang = LOCALE_MAP[language] || 'en-US';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const last = event.results[event.results.length - 1];
      const text = last[0].transcript;
      if (last.isFinal) {
        onResultRef.current?.(text);
        setIsListening(false);
      } else {
        onPartialResultRef.current?.(text);
      }
    };

    recognition.onerror = (event: any) => {
      const map: Record<string, string> = {
        'not-allowed': 'permission_denied',
        'no-speech': 'no_match',
        'network': 'network_error',
      };
      showError(map[event.error] || 'recognition_error');
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      webRecognizerRef.current = null;
    };

    webRecognizerRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [language, showError]);

  const startListening = useCallback(async () => {
    if (isListening) {
      await stopListening();
      return;
    }

    if (isNative) {
      await startListeningNative();
    } else {
      startListeningWeb();
    }
  }, [isListening, isNative, startListeningNative, startListeningWeb, stopListening]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isNative) {
        cleanupListeners();
      } else if (webRecognizerRef.current) {
        webRecognizerRef.current.stop();
      }
    };
  }, [isNative, cleanupListeners]);

  return {
    startListening,
    stopListening,
    isListening,
    isSupported,
  };
}
