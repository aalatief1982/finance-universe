
// This file ensures Capacitor plugins are properly initialized
import { Capacitor } from '@capacitor/core';

export const initializeCapacitor = () => {
  // Log the platform we're running on
  const platform = Capacitor.getPlatform();
  if (import.meta.env.MODE === 'development') {
    console.log(`[Capacitor] Running on: ${platform}`);
  }
  
  // Initialize any platform-specific code here
  if (platform === 'web') {
    if (import.meta.env.MODE === 'development') {
      console.log('[Capacitor] Using web compatibility mode');
    }
    // Web-specific initialization
  }
  
  // Return platform information for reference
  return {
    platform,
    isNative: Capacitor.isNativePlatform()
  };
};
