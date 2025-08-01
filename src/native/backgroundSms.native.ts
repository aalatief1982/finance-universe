
import { BackgroundSmsListener } from '@/plugins/BackgroundSmsListenerPlugin';
import type { BackgroundSmsListenerPlugin } from '@/plugins/BackgroundSmsListenerPlugin';
import { Capacitor } from '@capacitor/core';

// Create a wrapper around the actual plugin with better error handling
const BackgroundSmsListenerWrapper: BackgroundSmsListenerPlugin = {
  addListener: async (eventName, listenerFunc) => {
    try {
      if (import.meta.env.MODE === 'development') {
        console.log(`[SMS] Adding listener for event: ${eventName}`);
      }
      return await BackgroundSmsListener.addListener(eventName, listenerFunc);
    } catch (err) {
      if (import.meta.env.MODE === 'development') {
        console.error(`[SMS] Error adding listener for event ${eventName}:`, err);
      }
      throw err;
    }
  },
  
  checkPermission: async () => {
    try {
      if (import.meta.env.MODE === 'development') {
        console.log('[SMS] Checking permission');
      }
      const result = await BackgroundSmsListener.checkPermission();
      if (import.meta.env.MODE === 'development') {
        console.log('[SMS] Permission check result:', result);
      }
      return result;
    } catch (err) {
      if (import.meta.env.MODE === 'development') {
        console.warn('[SMS] Error checking permission:', err);
      }
      // Return a standard response object to avoid further errors
      return { granted: false };
    }
  },
  
  requestPermission: async () => {
    try {
      if (import.meta.env.MODE === 'development') {
        console.log('[SMS] Requesting permission');
      }
      const result = await BackgroundSmsListener.requestPermission();
      if (import.meta.env.MODE === 'development') {
        console.log('[SMS] Permission request result:', result);
      }
      return result;
    } catch (err) {
      if (import.meta.env.MODE === 'development') {
        console.warn('[SMS] Error requesting permission:', err);
      }
      // Return a standard response object to avoid further errors
      return { granted: false };
    }
  },
  
  startListening: async () => {
    try {
      if (import.meta.env.MODE === 'development') {
        console.log('[SMS] Starting to listen for SMS');
      }
      await BackgroundSmsListener.startListening();
      if (import.meta.env.MODE === 'development') {
        console.log('[SMS] Now listening for SMS');
      }
      return; // Return void as expected
    } catch (err) {
      if (import.meta.env.MODE === 'development') {
        console.warn('[SMS] Error starting to listen for SMS:', err);
      }
      // Don't rethrow to avoid app crashing
    }
  },
  
  stopListening: async () => {
    try {
      if (import.meta.env.MODE === 'development') {
        console.log('[SMS] Stopping listening for SMS');
      }
      await BackgroundSmsListener.stopListening();
      if (import.meta.env.MODE === 'development') {
        console.log('[SMS] Stopped listening for SMS');
      }
      return; // Return void as expected
    } catch (err) {
      if (import.meta.env.MODE === 'development') {
        console.warn('[SMS] Error stopping SMS listener:', err);
      }
      // Don't rethrow to avoid app crashing
    }
  }
};

export default BackgroundSmsListenerWrapper;
