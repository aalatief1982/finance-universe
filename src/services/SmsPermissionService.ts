
import { useToast } from '@/components/ui/use-toast';
import { ErrorType } from '@/types/error';
import { handleError } from '@/utils/error-utils';
import { Capacitor } from '@capacitor/core';

const SMS_PERMISSION_STORAGE_KEY = 'smsPermissionGranted';

class SmsPermissionService {
  // Check if app is running in a native mobile environment
  isNativeEnvironment(): boolean {
    return Capacitor.isNativePlatform();
  }

  // Get platform information
  getPlatform(): string {
    return Capacitor.getPlatform();
  }

  // Check if SMS permission has been granted
  hasPermission(): boolean {
    try {
      // First check if we're in a native environment
      if (!this.isNativeEnvironment()) {
        console.log('Not in native environment, using mock permissions');
        return localStorage.getItem(SMS_PERMISSION_STORAGE_KEY) === 'true';
      }

      // Use stored value since Capacitor doesn't have a built-in way to check SMS permissions
      return localStorage.getItem(SMS_PERMISSION_STORAGE_KEY) === 'true';
    } catch (error) {
      handleError({
        type: ErrorType.STORAGE,
        message: 'Failed to check SMS permission status',
        originalError: error
      });
      return false;
    }
  }

  // Save permission status
  savePermissionStatus(granted: boolean): void {
    try {
      localStorage.setItem(SMS_PERMISSION_STORAGE_KEY, granted ? 'true' : 'false');
    } catch (error) {
      handleError({
        type: ErrorType.STORAGE,
        message: 'Failed to save SMS permission status',
        originalError: error
      });
    }
  }

  // Request SMS permission (uses native APIs when available)
  async requestPermission(): Promise<boolean> {
    // Check if we're in a native environment
    if (!this.isNativeEnvironment()) {
      console.log('Not in native environment, using mock permissions');
      return this.mockRequestPermission();
    }

    try {
      const platform = this.getPlatform();
      
      if (platform === 'android') {
        return this.requestAndroidPermission();
      } else if (platform === 'ios') {
        return this.requestIosPermission();
      } else {
        console.log('Unsupported platform for SMS permissions:', platform);
        return this.mockRequestPermission();
      }
    } catch (error) {
      console.error('Error requesting SMS permission:', error);
      handleError({
        type: ErrorType.PERMISSION,
        message: 'Failed to request SMS permission',
        originalError: error
      });
      return false;
    }
  }

  // Mock permission request for development/testing
  private async mockRequestPermission(): Promise<boolean> {
    console.log('Using mock SMS permission request');
    return new Promise((resolve) => {
      // Simulate permission request with a delay
      setTimeout(() => {
        this.savePermissionStatus(true);
        resolve(true);
      }, 1000);
    });
  }

  // Request SMS permission on Android
  private async requestAndroidPermission(): Promise<boolean> {
    try {
      // On Android, we would use the Android Permissions plugin
      // This is a placeholder for actual implementation using Capacitor plugins
      console.log('Requesting Android SMS permission');
      
      // For actual implementation, you would use:
      // const { Permissions } = Plugins;
      // const { granted } = await Permissions.query({ name: 'sms' });
      
      // Simulate successful permission for now
      this.savePermissionStatus(true);
      return true;
    } catch (error) {
      console.error('Error requesting Android SMS permission:', error);
      return false;
    }
  }

  // Request SMS permission on iOS
  private async requestIosPermission(): Promise<boolean> {
    try {
      // iOS doesn't have direct SMS permission API
      // We would typically use a plugin or check if we can send messages
      console.log('iOS does not provide direct SMS permission API');
      
      // For demonstration, we'll simulate success
      this.savePermissionStatus(true);
      return true;
    } catch (error) {
      console.error('Error handling iOS SMS permission:', error);
      return false;
    }
  }
  
  // Check if the app can read SMS (permission granted and providers selected)
  canReadSms(): boolean {
    // Check both permission and if providers are selected
    return this.hasPermission() && this.hasProvidersSelected();
  }
  
  // Check if SMS providers have been selected
  hasProvidersSelected(): boolean {
    try {
      const providers = localStorage.getItem('sms_providers');
      if (!providers) {
        return false;
      }
      
      const parsedProviders = JSON.parse(providers);
      return Array.isArray(parsedProviders) && 
             parsedProviders.some((provider: any) => provider.isSelected);
    } catch (error) {
      handleError({
        type: ErrorType.STORAGE,
        message: 'Failed to check if SMS providers are selected',
        originalError: error
      });
      return false;
    }
  }
}

// Hook for using SMS permission with toast notifications
export const useSmsPermission = () => {
  const { toast } = useToast();
  const smsPermissionService = new SmsPermissionService();
  
  const requestPermission = async (): Promise<boolean> => {
    try {
      const granted = await smsPermissionService.requestPermission();
      
      if (granted) {
        toast({
          title: "Permission granted",
          description: "You've successfully granted SMS reading permission",
        });
      } else {
        toast({
          title: "Permission denied",
          description: "SMS reading permission is required for automatic tracking",
          variant: "destructive",
        });
      }
      
      return granted;
    } catch (error) {
      toast({
        title: "Error requesting permission",
        description: "There was a problem requesting SMS permission",
        variant: "destructive",
      });
      return false;
    }
  };
  
  return {
    hasPermission: smsPermissionService.hasPermission.bind(smsPermissionService),
    requestPermission,
    canReadSms: smsPermissionService.canReadSms.bind(smsPermissionService),
    isNativeEnvironment: smsPermissionService.isNativeEnvironment.bind(smsPermissionService)
  };
};

// Export a singleton instance
export const smsPermissionService = new SmsPermissionService();
