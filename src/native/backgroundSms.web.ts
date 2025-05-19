
import type { BackgroundSmsListenerPlugin } from '@/plugins/BackgroundSmsListenerPlugin';
import { PluginListenerHandle } from '@capacitor/core';

// Mock implementation for web testing
const BackgroundSmsListenerWeb: BackgroundSmsListenerPlugin = {
  addListener: async (eventName, listenerFunc) => {
    console.log(`[SMS Web Mock] Added listener for event: ${eventName}`);
    
    // Return a dummy listener handle
    return {
      remove: async () => {
        console.log(`[SMS Web Mock] Removed listener for event: ${eventName}`);
      }
    } as PluginListenerHandle;
  },
  
  checkPermission: async () => {
    console.log('[SMS Web Mock] Check permission called');
    return { granted: true }; // Always return granted for web testing
  },
  
  requestPermission: async () => {
    console.log('[SMS Web Mock] Request permission called');
    return { granted: true }; // Always return granted for web testing
  },
  
  startListening: async () => {
    console.log('[SMS Web Mock] Start listening called');
    
    // Simulate receiving an SMS after 5 seconds
    setTimeout(() => {
      const mockEvent = {
        sender: '+123456789',
        body: 'This is a test SMS message. Your account was charged $25.50 at ACME Store on May 19.'
      };
      console.log('[SMS Web Mock] Simulating SMS received:', mockEvent);
      document.dispatchEvent(new CustomEvent('smsReceived', { detail: mockEvent }));
    }, 5000);
  },
  
  stopListening: async () => {
    console.log('[SMS Web Mock] Stop listening called');
  }
};

export default BackgroundSmsListenerWeb;
