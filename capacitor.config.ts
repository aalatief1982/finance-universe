
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.xpensia.com',
  appName: 'Xpensia',
  webDir: 'dist',
  // Commenting out server URL for production build
  // server: {
  //   url: 'https://44f11ecc-0e77-4a7d-a302-6102d5d50c2b.lovableproject.com?forceHideBadge=true',
  //   cleartext: true
  // },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0
    },
    Permissions: {
      permissions: ["sms"]
    }
  },
  android: {
    appendUserAgent: 'Xpensia Android App'
  }
};

export default config;
