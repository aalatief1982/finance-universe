import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.xpensia.com',
  appName: 'Xpensia',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      launchShowDuration: 0
    },
    SmsReaderPlugin: {
      android: true
    },
    BackgroundSmsListener: {
      android: true
    }
  },
  android: {
    appendUserAgent: 'Xpensia Android App'
  }
};

export default config;
