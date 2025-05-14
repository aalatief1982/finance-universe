import { Capacitor } from '@capacitor/core';

export default (async () => {
  if (Capacitor.getPlatform() === 'web') {
    return (await import('./backgroundSms.web')).default;
  } else {
    return (await import('./backgroundSms.native')).default;
  }
})();
