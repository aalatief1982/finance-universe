
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

declare module '@capacitor-firebase/analytics' {
  export interface LogEventOptions {
    name: string
    params?: { [key: string]: any }
  }

  export interface SetUserIdOptions {
    userId: string | null
  }

  export interface SetUserPropertyOptions {
    key: string
    value: string | null
  }

  export interface SetSessionTimeoutDurationOptions {
    duration: number
  }

  export interface SetEnabledOptions {
    enabled: boolean
  }

  export interface IsEnabledResult {
    enabled: boolean
  }

  export interface GetAppInstanceIdResult {
    appInstanceId?: string
  }

  export const FirebaseAnalytics: {
    enable: () => Promise<void>
    logEvent: (options: LogEventOptions) => Promise<void>
    setUserId: (options: SetUserIdOptions) => Promise<void>
    setUserProperty: (options: SetUserPropertyOptions) => Promise<void>
    setCurrentScreen: (
      options: { screenName: string | null; screenClassOverride?: string | null }
    ) => Promise<void>
    setSessionTimeoutDuration: (
      options: SetSessionTimeoutDurationOptions
    ) => Promise<void>
    setEnabled: (options: SetEnabledOptions) => Promise<void>
    isEnabled: () => Promise<IsEnabledResult>
    getAppInstanceId: () => Promise<GetAppInstanceIdResult>
    resetAnalyticsData: () => Promise<void>
  }
}
