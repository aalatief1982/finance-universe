import { Capacitor } from '@capacitor/core';

export interface AndroidSettingsPlugin {
  openNotificationSettings(): Promise<void>;
  openAppDetailsSettings(): Promise<void>;
}

const AndroidSettings = Capacitor.registerPlugin<AndroidSettingsPlugin>('AndroidSettings');

export { AndroidSettings };
