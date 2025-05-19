
import type { BackgroundSmsListenerPlugin } from '@/plugins/BackgroundSmsListenerPlugin';

// Mock implementation for web environment
const BackgroundSmsListenerWeb: BackgroundSmsListenerPlugin = {
  addListener: async (eventName, listenerFunc) => {
    console.log(`[SMS-Web] Adding listener for event: ${eventName} (web mock)`);
    
    // Return a mock handle with a remove method
    return {
      remove: async () => {
        console.log('[SMS-Web] Removing listener (web mock)');
        return Promise.resolve();
      }
    };
  },
  
  checkPermission: async () => {
    console.log('[SMS-Web] Checking permission (web mock)');
    return { granted: false };
  },
  
  requestPermission: async () => {
    console.log('[SMS-Web] Requesting permission (web mock)');
    return { granted: false };
  },
  
  startListening: async () => {
    console.log('[SMS-Web] Starting to listen for SMS (web mock)');
    return;
  },
  
  stopListening: async () => {
    console.log('[SMS-Web] Stopping listening for SMS (web mock)');
    return;
  }
};

export default BackgroundSmsListenerWeb;
