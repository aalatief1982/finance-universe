
import type { BackgroundSmsListenerPlugin } from '@/plugins/BackgroundSmsListenerPlugin';
import type { PluginListenerHandle } from '@capacitor/core';

// Mock implementation for web development/testing
const BackgroundSmsListenerWeb: BackgroundSmsListenerPlugin = {
  addListener: async (eventName, listenerFunc) => {
    console.log(`[SMS-Web] Added listener for ${eventName}`);
    
    // Return a mock listener handle
    return {
      remove: async () => {
        console.log(`[SMS-Web] Removed listener for ${eventName}`);
      }
    } as PluginListenerHandle;
  },
  
  checkPermission: async () => {
    console.log('[SMS-Web] Checking permission (web mock)');
    // For browser testing, check if permission was stored in localStorage
    const granted = localStorage.getItem('sms_permission') === 'granted';
    console.log('[SMS-Web] Permission status:', granted);
    return { granted };
  },
  
  requestPermission: async () => {
    console.log('[SMS-Web] Requesting permission (web mock)');
    // For browser testing, simulate permission grant and store in localStorage
    localStorage.setItem('sms_permission', 'granted');
    return { granted: true };
  },
  
  startListening: async () => {
    console.log('[SMS-Web] Started listening for SMS (web mock)');
    return;
  },
  
  stopListening: async () => {
    console.log('[SMS-Web] Stopped listening for SMS (web mock)');
    return;
  }
};

export default BackgroundSmsListenerWeb;
