
/**
 * Web implementation of Background SMS listener
 * This is just a stub since web doesn't support SMS functionality
 */

interface BackgroundSmsListener {
  addListener(eventName: 'smsReceived', 
    listenerFunc: (data: { sender: string; body: string }) => void
  ): Promise<{ remove: () => Promise<void> }>;
  
  checkPermission(): Promise<{ granted: boolean }>;
  requestPermission(): Promise<{ granted: boolean }>;
  startListening(): Promise<void>;
  stopListening(): Promise<void>;
}

const BackgroundSmsListener: BackgroundSmsListener = {
  addListener: async (eventName, listenerFunc) => {
    console.log('[SMS Web] Cannot listen for SMS in web environment');
    // Return a dummy remove function
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
