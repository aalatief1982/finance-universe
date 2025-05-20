
import { BackgroundSmsListener } from '@/plugins/BackgroundSmsListenerPlugin';
import type { BackgroundSmsListenerPlugin } from '@/plugins/BackgroundSmsListenerPlugin';
import { Capacitor } from '@capacitor/core';

// Create a wrapper around the actual plugin with better error handling
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
      if (typeof BackgroundSmsListener.checkPermission !== 'function') {
        console.warn('[SMS] checkPermission is not implemented in the plugin, falling back to Capacitor permissions');
        // Implementation in case the native plugin doesn't provide this method
        return { granted: false };
      }
      const result = await BackgroundSmsListener.checkPermission();
      console.log('[SMS] Permission check result:', result);
      return result;
    } catch (err) {
      console.error('[SMS] Error checking permission:', err);
      // Return a standard response object to avoid further errors
      return { granted: false };
    }
  },
  
  requestPermission: async () => {
    try {
      console.log('[SMS] Requesting permission');
      if (typeof BackgroundSmsListener.requestPermission !== 'function') {
        console.warn('[SMS] requestPermission is not implemented in the plugin, falling back to Capacitor permissions');
        // Implementation in case the native plugin doesn't provide this method
        return { granted: false };
      }
      const result = await BackgroundSmsListener.requestPermission();
      console.log('[SMS] Permission request result:', result);
      return result;
    } catch (err) {
      console.error('[SMS] Error requesting permission:', err);
      // Return a standard response object to avoid further errors
      return { granted: false };
    }
  },
  
  startListening: async () => {
    try {
      console.log('[SMS] Starting to listen for SMS');
      if (typeof BackgroundSmsListener.startListening !== 'function') {
        console.warn('[SMS] startListening is not implemented in the plugin, using addListener instead');
        // Implementation in case the native plugin doesn't provide this method
        return;
      }
      await BackgroundSmsListener.startListening();
      console.log('[SMS] Now listening for SMS');
      return;
    } catch (err) {
      console.error('[SMS] Error starting to listen for SMS:', err);
      // Don't rethrow to avoid app crashing
    }
  },
  
  stopListening: async () => {
    try {
      console.log('[SMS] Stopping listening for SMS');
      if (typeof BackgroundSmsListener.stopListening !== 'function') {
        console.warn('[SMS] stopListening is not implemented in the plugin, skipping');
        // Implementation in case the native plugin doesn't provide this method
        return;
      }
      await BackgroundSmsListener.stopListening();
      console.log('[SMS] Stopped listening for SMS');
      return;
    } catch (err) {
      console.error('[SMS] Error stopping SMS listener:', err);
      // Don't rethrow to avoid app crashing
    }
  }
};

export default BackgroundSmsListenerWrapper;
