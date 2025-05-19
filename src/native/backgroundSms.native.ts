import { registerPlugin } from '@capacitor/core';
import type { BackgroundSmsListenerPlugin } from '@/plugins/BackgroundSmsListenerPlugin';
import { SmsReader } from '@/plugins/SmsReaderPlugin';

// Create a wrapper around SmsReader that implements BackgroundSmsListenerPlugin
const BackgroundSmsListener: BackgroundSmsListenerPlugin = {
  addListener: async (eventName, listenerFunc) => {
    // Return a dummy listener that can be removed
    return {
      remove: async () => {
        // Cleanup
      }
    };
  },
  
  checkPermission: async () => {
    return SmsReader.checkPermission();
  },
  
  requestPermission: async () => {
    return SmsReader.requestPermission();
  },
  
  startListening: async () => {
    // Initial permission check
    const permission = await SmsReader.checkPermission();
    if (!permission.granted) {
      throw new Error('SMS permission not granted');
    }
  },
  
  stopListening: async () => {
    // No cleanup needed
  }
};

export default BackgroundSmsListener;
