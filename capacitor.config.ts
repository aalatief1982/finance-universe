
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
          CapacitorUpdater: {
      autoUpdate: false
    },
    SplashScreen: {
      launchShowDuration: 0
    },
    SmsReaderPlugin: {
      android: true
    },
    BackgroundSmsListener: {
      android: true
    },
    Updater: {
      autoSync: false
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
