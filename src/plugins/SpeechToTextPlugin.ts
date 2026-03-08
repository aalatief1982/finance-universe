import { Capacitor, registerPlugin } from '@capacitor/core';
import type { PluginListenerHandle } from '@capacitor/core';

export interface SpeechToTextPlugin {
  startListening(options: { locale: string }): Promise<void>;
  stopListening(): Promise<void>;
  isAvailable(): Promise<{ available: boolean }>;
  checkPermissions(): Promise<{ microphone: string }>;
  requestPermissions(): Promise<{ microphone: string }>;
  addListener(
    eventName: 'speechResult',
    listenerFunc: (data: { text: string; isFinal: boolean }) => void
  ): Promise<PluginListenerHandle>;
  addListener(
    eventName: 'speechError',
    listenerFunc: (data: { error: string }) => void
  ): Promise<PluginListenerHandle>;
  addListener(
    eventName: 'speechState',
    listenerFunc: (data: { status: string }) => void
  ): Promise<PluginListenerHandle>;
}

const SpeechToText = registerPlugin<SpeechToTextPlugin>('SpeechToText');

export { SpeechToText };
