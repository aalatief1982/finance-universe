import { safeStorage } from "@/utils/safe-storage";

import type { BackgroundSmsListenerPlugin } from '@/plugins/BackgroundSmsListenerPlugin';
import type { PluginListenerHandle } from '@capacitor/core';

// Mock implementation for web environments
const BackgroundSmsListenerWebMock: BackgroundSmsListenerPlugin = {
  addListener: async (eventName, listenerFunc) => {
    if (import.meta.env.MODE === 'development') {
      console.log(`[SMS-Web] Adding listener for event: ${eventName} (simulation)`);
    }
    
    // Return a mock listener handle
    return {
      remove: async () => {
        if (import.meta.env.MODE === 'development') {
          console.log(`[SMS-Web] Removing listener for event: ${eventName} (simulation)`);
        }
      }
    } as PluginListenerHandle;
  },
  
  checkPermission: async () => {
    if (import.meta.env.MODE === 'development') {
      console.log('[SMS-Web] Checking permission (simulation)');
    }
    // In web environment, always return permission as granted for testing
    const simulatedGranted = safeStorage.getItem('sms_permission_simulation') === 'granted';
    return { granted: simulatedGranted };
  },
  
  requestPermission: async () => {
    if (import.meta.env.MODE === 'development') {
      console.log('[SMS-Web] Requesting permission (simulation)');
    }
    // Simulate a permission grant
    safeStorage.setItem('sms_permission_simulation', 'granted');
    return { granted: true };
  },
  
  startListening: async () => {
    if (import.meta.env.MODE === 'development') {
      console.log('[SMS-Web] Starting to listen for SMS (simulation)');
    }
    // Nothing to do in web environment
    return;
  },
  
  stopListening: async () => {
    if (import.meta.env.MODE === 'development') {
      console.log('[SMS-Web] Stopping listening for SMS (simulation)');
    }
    // Nothing to do in web environment
    return;
  }
};

export default BackgroundSmsListenerWebMock;
