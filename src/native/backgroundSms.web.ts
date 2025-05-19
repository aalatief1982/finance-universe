/**
 * Web implementation of Background SMS listener
 * This is just a stub since web doesn't support SMS functionality
 */

import type { BackgroundSmsListenerPlugin } from '@/plugins/BackgroundSmsListenerPlugin';

const BackgroundSmsListener: BackgroundSmsListenerPlugin = {
  addListener: async (eventName, listenerFunc) => {
    console.log('[SMS Web] Cannot listen for SMS in web environment');
    return {
      remove: async () => {
        console.log('[SMS Web] Remove listener called (no-op)');
      }
    };
  },
  
  checkPermission: async () => {
    console.log('[SMS Web] Check permission called (always returns false on web)');
    return { granted: false };
  },
  
  requestPermission: async () => {
    console.log('[SMS Web] Request permission called (always returns false on web)');
    return { granted: false };
  },
  
  startListening: async () => {
    console.log('[SMS Web] Start listening called (no-op on web)');
  },
  
  stopListening: async () => {
    console.log('[SMS Web] Stop listening called (no-op on web)');
  }
};

export default BackgroundSmsListener;
