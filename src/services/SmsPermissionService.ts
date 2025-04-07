
import { Capacitor } from '@capacitor/core';
import { registerPlugin } from '@capacitor/core';

// Define a type for the AndroidPermissions plugin
interface AndroidPermissionsPlugin {
  checkPermission: (options: { permission: string }) => Promise<{ value: boolean }>;
  requestPermission: (options: { permission: string }) => Promise<{ value: boolean }>;
}

// Register the Android Permissions plugin
const AndroidPermissions = registerPlugin<AndroidPermissionsPlugin>('AndroidPermissions');

class SmsPermissionService {
  private permissionKey = 'sms_permission_granted';
  
  /**
   * Check if we're in a native mobile environment
   */
  isNativeEnvironment(): boolean {
    return Capacitor.isNativePlatform();
  }
  
  /**
   * Check if SMS permission has been granted
   */
  async hasPermission(): Promise<boolean> {
    if (!this.isNativeEnvironment()) {
      return localStorage.getItem(this.permissionKey) === 'true';
    }
    
    try {
      // Use the AndroidPermissions plugin
      const result = await AndroidPermissions.checkPermission({ 
        permission: 'android.permission.READ_SMS' 
      });
      return result.value;
    } catch (error) {
      console.error('Error checking SMS permission:', error);
      return false;
    }
  }
  
  /**
   * Request SMS permission
   * @returns Promise resolving to boolean indicating if permission was granted
   */
  async requestPermission(): Promise<boolean> {
    if (!this.isNativeEnvironment()) {
      // For web development, simulate a permission request
      await new Promise(resolve => setTimeout(resolve, 1000));
      localStorage.setItem(this.permissionKey, 'true');
      return true;
    }
    
    try {
      // Use the AndroidPermissions plugin
      const result = await AndroidPermissions.requestPermission({ 
        permission: 'android.permission.READ_SMS' 
      });
      const granted = result.value;
      localStorage.setItem(this.permissionKey, granted ? 'true' : 'false');
      return granted;
    } catch (error) {
      console.error('Error requesting SMS permission:', error);
      return false;
    }
  }
  
  /**
   * Set permission status directly (for simulation)
   */
  setPermissionStatus(granted: boolean): void {
    localStorage.setItem(this.permissionKey, granted ? 'true' : 'false');
  }
  
  /**
   * Save permission status (alias for setPermissionStatus for compatibility)
   */
  savePermissionStatus(granted: boolean): void {
    this.setPermissionStatus(granted);
  }
}

// Export a singleton instance
export const smsPermissionService = new SmsPermissionService();
