
/// <reference types="vite/client" />

// Capacitor module declarations
declare module '@capacitor/core' {
  export const Capacitor: {
    isNativePlatform: () => boolean;
    getPlatform: () => string;
    registerPlugin: <T>(name: string) => T;
  };
  export type PluginListenerHandle = {
    remove: () => Promise<void>;
  };
}

declare module '@capacitor/status-bar' {
  export const StatusBar: {
    setOverlaysWebView: (options: { overlay: boolean }) => Promise<void>;
    setBackgroundColor: (options: { color: string }) => Promise<void>;
    setStyle: (options: { style: Style }) => Promise<void>;
  };
  export enum Style {
    Default = 'DEFAULT',
    Light = 'LIGHT',
    Dark = 'DARK'
  }
}

declare module '@capacitor/app' {
  export const App: {
    getState: () => Promise<{ isActive: boolean }>;
    addListener: (
      event: string,
      callback: (state: { isActive: boolean }) => void
    ) => Promise<PluginListenerHandle>;
  };
}

declare module '@capacitor/local-notifications' {
  export const LocalNotifications: {
    schedule: (options: { notifications: any[] }) => Promise<void>;
    addListener: (eventName: string, callback: (event: any) => void) => Promise<any>;
  };
}
