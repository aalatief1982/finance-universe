import { Capacitor } from '@capacitor/core';
import type { PluginListenerHandle } from '@capacitor/core';

export interface ShareTargetPlugin {
  addListener(
    eventName: 'sharedTextReceived',
    listenerFunc: (data: { text: string; source?: string; receivedAt?: number }) => void,
  ): Promise<PluginListenerHandle>;
  consumePendingSharedText(): Promise<{ text?: string; source?: string; receivedAt?: number }>;
}

const ShareTarget = Capacitor.registerPlugin<ShareTargetPlugin>('ShareTarget');

export { ShareTarget };
