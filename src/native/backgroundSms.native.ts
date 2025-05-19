
import { BackgroundSmsListener } from '@/plugins/BackgroundSmsListenerPlugin';
import type { BackgroundSmsListenerPlugin } from '@/plugins/BackgroundSmsListenerPlugin';

// Create a wrapper around the actual plugin
const BackgroundSmsListenerWrapper: BackgroundSmsListenerPlugin = {
  addListener: async (eventName, listenerFunc) => {
    return BackgroundSmsListener.addListener(eventName, listenerFunc);
  },
  
  checkPermission: async () => {
    return BackgroundSmsListener.checkPermission();
  },
  
  requestPermission: async () => {
    return BackgroundSmsListener.requestPermission();
  },
  
  startListening: async () => {
    return BackgroundSmsListener.startListening();
  },
  
  stopListening: async () => {
    return BackgroundSmsListener.stopListening();
  }
};

export default BackgroundSmsListenerWrapper;
