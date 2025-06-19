
import { CapacitorConfig } from '@capacitor/cli'; 

const config: CapacitorConfig = {
  appId: 'app.expensia.com',
  appName: 'Expensia',
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
    CapacitorHttp: {
      enabled: true
    }
  },
  android: {
    appendUserAgent: 'Expensia Android App'
  }
};

export default config;
