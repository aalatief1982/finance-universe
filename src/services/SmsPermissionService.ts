
import { useToast } from '@/components/ui/use-toast';
import { ErrorType } from '@/types/error';
import { handleError } from '@/utils/error-utils';

const SMS_PERMISSION_STORAGE_KEY = 'smsPermissionGranted';

class SmsPermissionService {
  // Check if SMS permission has been granted
  hasPermission(): boolean {
    try {
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

  // Request SMS permission (in a real mobile app, this would use native APIs)
  async requestPermission(): Promise<boolean> {
    return new Promise((resolve) => {
      // In a real app, this would use Capacitor or Cordova plugins
      // For now, simulate a permission request with a delay
      setTimeout(() => {
        this.savePermissionStatus(true);
        resolve(true);
      }, 1000);
    });
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
    canReadSms: smsPermissionService.canReadSms.bind(smsPermissionService)
  };
};

// Export a singleton instance
export const smsPermissionService = new SmsPermissionService();
