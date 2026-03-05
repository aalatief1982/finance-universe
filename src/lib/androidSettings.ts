import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

import { AndroidSettings } from '@/plugins/AndroidSettingsPlugin';

const isAndroidNative = () => Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';

const openGenericSettingsFallback = async () => {
  try {
    const appPlugin = App as unknown as { openSettings?: () => Promise<void> };
    if (typeof appPlugin.openSettings === 'function') {
      await appPlugin.openSettings();
      return;
    }
    window.open('app-settings:');
  } catch {
    window.open('app-settings:');
  }
};

export const openAndroidNotificationSettings = async () => {
  if (!isAndroidNative()) return;

  try {
    await AndroidSettings.openNotificationSettings();
  } catch {
    await openGenericSettingsFallback();
  }
};

export const openAndroidAppPermissionsSettings = async () => {
  if (!isAndroidNative()) return;

  try {
    await AndroidSettings.openAppDetailsSettings();
  } catch {
    await openGenericSettingsFallback();
  }
};
