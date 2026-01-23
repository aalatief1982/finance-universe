import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.xpensia.com',
  appName: 'Xpensia',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0
    },
    SmsReaderPlugin: {
      android: true
    },
    BackgroundSmsListener: {
      android: true
    },
    CapacitorUpdater: {
      autoUpdate: false,
      updateUrl: 'https://xpensia-505ac.web.app/manifest.json',
      statsUrl: '',
      channelUrl: '',
      appReadyTimeout: 10000,
      responseTimeout: 60,
    },
    CapacitorHttp: {
      enabled: true
    },
    FirebaseAnalytics: {
      enableNative: true
    }
  },
  android: {
    appendUserAgent: 'Xpensia Android App'
  }
};

export default config;
