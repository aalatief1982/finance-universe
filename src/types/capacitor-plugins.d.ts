/**
 * @file capacitor-plugins.d.ts
 * @description Type definitions for capacitor-plugins.d.
 *
 * @module types/capacitor-plugins.d
 *
 * @responsibilities
 * 1. Define shared interfaces and type aliases
 * 2. Provide consistent contracts across services and UI
 *
 * @review-tags
 * - @data-contract: shared types
 *
 * @review-checklist
 * - [ ] Types align with runtime data shapes
 * - [ ] Optional fields documented where needed
 */

declare module '@capacitor/core' {
  interface PluginRegistry {
    BackgroundSmsListener: any;
  }
}

declare module 'capacitor-background-sms-listener' {
  import type { PluginListenerHandle } from '@capacitor/core';
  
  export interface BackgroundSmsListenerPlugin {
    addListener(
      eventName: 'smsReceived',
      listenerFunc: (data: { sender: string; body: string }) => void
    ): Promise<PluginListenerHandle>;
    checkPermission(): Promise<{ granted: boolean }>;
    checkPermissionWithRationale(): Promise<{ granted: boolean; shouldShowRationale: boolean }>;
    requestPermission(): Promise<{ granted: boolean }>;
    startListening(): Promise<void>;
    stopListening(): Promise<void>;
  }
  
  export const BackgroundSmsListener: BackgroundSmsListenerPlugin;
}
