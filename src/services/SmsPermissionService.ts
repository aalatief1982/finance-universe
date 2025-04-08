
import { Capacitor } from '@capacitor/core';
// Use the Permissions interface from Capacitor core
import { Plugins } from '@capacitor/core';

class SmsPermissionService {
  private permissionStatusKey = 'sms_permission_status';
  private providersKey = 'sms_providers_selected';

  // Check if running on native platform
  isNativeEnvironment(): boolean {
    return Capacitor.isNativePlatform();
  }

  // Check if SMS permission is granted
  hasPermission(): boolean {
    // In a real implementation, this would check actual device permissions
    // For now, we'll use localStorage to simulate permission state
    if (typeof window === 'undefined') return false;
    
    const permissionStatus = localStorage.getItem(this.permissionStatusKey);
    return permissionStatus === 'granted';
  }

  // Check if SMS can be read (permission is granted)
  canReadSms(): boolean {
    return this.hasPermission();
  }

  // Check if user has selected SMS providers
  hasProvidersSelected(): boolean {
    if (typeof window === 'undefined') return false;
    
    const providers = localStorage.getItem(this.providersKey);
    // If providers exist and is not an empty array
    return !!providers && providers !== '[]';
  }

  // Request SMS permission using native dialog
  async requestPermission(): Promise<boolean> {
    if (this.isNativeEnvironment()) {
      try {
        console.log('Requesting native SMS permission dialog on Android/iOS');
        
        // Use Capacitor's native API via Plugins interface
        const { Permissions } = Plugins;
        
        if (!Permissions) {
          console.warn('Permissions plugin not available, simulating permission grant');
          await new Promise(resolve => setTimeout(resolve, 1000));
          this.savePermissionStatus(true);
          return true;
        }
        
        // Request the SMS permission
        const result = await Permissions.query({ name: 'sms' });
        
        if (result.state === 'granted') {
          this.savePermissionStatus(true);
          return true;
        } else if (result.state === 'prompt') {
          // We need to request permission
          const requestResult = await Permissions.request({ name: 'sms' });
          const granted = requestResult.state === 'granted';
          this.savePermissionStatus(granted);
          return granted;
        } else {
          // Permission denied
          this.savePermissionStatus(false);
          return false;
        }
      } catch (error) {
        console.error('Error requesting SMS permission:', error);
        // Fallback to simulation in case of error
        await new Promise(resolve => setTimeout(resolve, 1000));
        this.savePermissionStatus(true);
        return true;
      }
    } else {
      // In web environment, simulate permission dialog
      console.log('Simulating SMS permission request in web environment');
      await new Promise(resolve => setTimeout(resolve, 1000));
      this.savePermissionStatus(true);
      return true;
    }
  }

  // Save permission status to localStorage
  savePermissionStatus(granted: boolean): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.permissionStatusKey, granted ? 'granted' : 'denied');
    }
  }

  // Save selected providers status
  saveProvidersStatus(hasProviders: boolean): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.providersKey, hasProviders ? 'true' : 'false');
    }
  }
}

export const smsPermissionService = new SmsPermissionService();
