
// Mock implementation for web environment
const BackgroundSmsListener = {
  addListener: (eventName: string, listenerFunc: Function) => {
    console.log(`[SMS Web] Would add listener for ${eventName} if this was a native device`);
    return {
      remove: async () => {
        console.log(`[SMS Web] Would remove listener for ${eventName} if this was a native device`);
      }
    };
  },
  checkPermission: async () => {
    console.log('[SMS Web] Would check permissions if this was a native device');
    return { granted: false };
  },
  requestPermission: async () => {
    console.log('[SMS Web] Would request permissions if this was a native device');
    return { granted: false };
  },
  startListening: async () => {
    console.log('[SMS Web] Would start listening if this was a native device');
  },
  stopListening: async () => {
    console.log('[SMS Web] Would stop listening if this was a native device');
  }
};

export default BackgroundSmsListener;
