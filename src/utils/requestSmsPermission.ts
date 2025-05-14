import { Capacitor } from '@capacitor/core';

export async function requestSmsPermission(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;

  const perm = await (window as any).cordova?.plugins?.diagnostic?.getPermissionAuthorizationStatus;
  if (perm) return true; // already granted

  const { PermissionsAndroid } = await import('react-native');

  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
    {
      title: 'SMS Permission Required',
      message: 'This app needs access to read incoming SMS messages.',
      buttonPositive: 'Allow'
    }
  );

  return granted === PermissionsAndroid.RESULTS.GRANTED;
}
