import { Capacitor } from '@capacitor/core';

interface PermissionsAndroidModule {
  request: (permission: string, options: { title: string; message: string; buttonPositive: string }) => Promise<string>;
  PERMISSIONS: { RECEIVE_SMS: string };
  RESULTS: { GRANTED: string };
}

interface CordovaWindow extends Window {
  cordova?: {
    plugins?: {
      diagnostic?: {
        getPermissionAuthorizationStatus?: unknown;
      };
    };
  };
}

export async function requestSmsPermission(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;

  const cordovaWindow = window as CordovaWindow;
  const perm = cordovaWindow.cordova?.plugins?.diagnostic?.getPermissionAuthorizationStatus;
  if (perm) return true; // already granted

  try {
    const { PermissionsAndroid } = await import('react-native') as { PermissionsAndroid: PermissionsAndroidModule };

    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
      {
        title: 'SMS Permission Required',
        message: 'This app needs access to read incoming SMS messages.',
        buttonPositive: 'Allow'
      }
    );
    if (import.meta.env.MODE === 'development') {
      // console.log('[Xpensia] SMS permission:', granted);
    }

    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch {
    return false;
  }
}
