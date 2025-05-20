
import type { BackgroundSmsListenerPlugin } from '@/plugins/BackgroundSmsListenerPlugin';
import type { PluginListenerHandle } from '@capacitor/core';

// Mock implementation for web environments
const BackgroundSmsListenerWebMock: BackgroundSmsListenerPlugin = {
  addListener: async (eventName, listenerFunc) => {
    console.log(`[SMS-Web] Adding listener for event: ${eventName} (simulation)`);
    
    // Return a mock listener handle
    return {
      remove: async () => {
        console.log(`[SMS-Web] Removing listener for event: ${eventName} (simulation)`);
      }
    } as PluginListenerHandle;
  },
  
  checkPermission: async () => {
    console.log('[SMS-Web] Checking permission (simulation)');
    // In web environment, always return permission as granted for testing
    const simulatedGranted = localStorage.getItem('sms_permission_simulation') === 'granted';
    return { granted: simulatedGranted };
  },
  
  requestPermission: async () => {
    console.log('[SMS-Web] Requesting permission (simulation)');
    // Simulate a permission grant
    localStorage.setItem('sms_permission_simulation', 'granted');
    return { granted: true };
  },
  
  startListening: async () => {
    console.log('[SMS-Web] Starting to listen for SMS (simulation)');
    // Nothing to do in web environment
  },
  
  stopListening: async () => {
    console.log('[SMS-Web] Stopping listening for SMS (simulation)');
    // Nothing to do in web environment
  }
};

export default BackgroundSmsListenerWebMock;
