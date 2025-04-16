
declare module '@capacitor/core' {
  export interface PluginRegistry {
    [key: string]: any;
  }

  export interface PluginImplementations {
    [key: string]: any;
  }

  export interface PluginConfig {
    [key: string]: any;
  }

  export interface PluginResult {
    [key: string]: any;
  }

  export interface PluginResultError {
    message: string;
    code?: string;
  }

  export interface PluginRegistryData {
    implementations: PluginImplementations;
    config: PluginConfig;
  }

  export interface PluginListenerHandle {
    remove: () => Promise<void>;
  }

  export interface Plugin {
    addListener: (eventName: string, listenerFunc: (...args: any[]) => any) => PluginListenerHandle;
    request: (pluginName: string, method: string, options?: any) => Promise<PluginResult>;
  }

  export class Capacitor {
    static platform: 'web' | 'ios' | 'android';
    static isPluginAvailable: (name: string) => boolean;
    static convertFileSrc: (filePath: string) => string;
    static getPlatform: () => 'web' | 'ios' | 'android';
    static isNativePlatform: () => boolean;
  }

  export class WebPlugin implements Plugin {
    constructor(config?: {[key: string]: any});
    addListener(eventName: string, listenerFunc: (...args: any[]) => any): PluginListenerHandle;
    request(pluginName: string, method: string, options?: any): Promise<PluginResult>;
    removeAllListeners(): void;
  }

  export class CapacitorException extends Error {
    constructor(message: string, code?: string);
    message: string;
    code?: string;
  }

  export const Plugins: PluginRegistry;

  export interface PermissionResult {
    state: 'granted' | 'denied' | 'prompt';
  }

  export interface PermissionStatus {
    camera: PermissionResult;
    photos: PermissionResult;
    geolocation: PermissionResult;
    notifications: PermissionResult;
    clipboard: PermissionResult;
    microphone: PermissionResult;
  }

  export interface PermissionsRequestOptions {
    permissions: string[];
  }

  export interface PermissionsOptions {
    permissions: string[];
  }

  export interface PermissionsPlugin {
    query(options: PermissionsOptions): Promise<PermissionStatus>;
    requestPermissions(options: PermissionsRequestOptions): Promise<PermissionStatus>;
  }

  export const Permissions: PermissionsPlugin;
}
