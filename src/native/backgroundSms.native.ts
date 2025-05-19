
import { BackgroundSmsListener } from '@/plugins/BackgroundSmsListenerPlugin';
import type { BackgroundSmsListenerPlugin } from '@/plugins/BackgroundSmsListenerPlugin';

// Create a wrapper around the actual plugin
const BackgroundSmsListenerWrapper: BackgroundSmsListenerPlugin = {
  addListener: async (eventName, listenerFunc) => {
    try {
      console.log(`[SMS] Adding listener for event: ${eventName}`);
      return await BackgroundSmsListener.addListener(eventName, listenerFunc);
    } catch (err) {
      console.error(`[SMS] Error adding listener for event ${eventName}:`, err);
      throw err;
    }
  },
  
  checkPermission: async () => {
    try {
      console.log('[SMS] Checking permission');
      const result = await BackgroundSmsListener.checkPermission();
      console.log('[SMS] Permission check result:', result);
      return result;
    } catch (err) {
      console.error('[SMS] Error checking permission:', err);
      throw err;
    }
  },
  
  requestPermission: async () => {
    try {
      console.log('[SMS] Requesting permission');
      const result = await BackgroundSmsListener.requestPermission();
      console.log('[SMS] Permission request result:', result);
      return result;
    } catch (err) {
      console.error('[SMS] Error requesting permission:', err);
      throw err;
    }
  },
  
  startListening: async () => {
    try {
      console.log('[SMS] Starting to listen for SMS');
      await BackgroundSmsListener.startListening();
      console.log('[SMS] Now listening for SMS');
      return;
    } catch (err) {
      console.error('[SMS] Error starting to listen for SMS:', err);
      throw err;
    }
  },
  
  stopListening: async () => {
    try {
      console.log('[SMS] Stopping listening for SMS');
      await BackgroundSmsListener.stopListening();
      console.log('[SMS] Stopped listening for SMS');
      return;
    } catch (err) {
      console.error('[SMS] Error stopping SMS listener:', err);
      throw err;
    }
  }
};

export default BackgroundSmsListenerWrapper;
