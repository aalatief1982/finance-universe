
import { Capacitor } from '@capacitor/core';
import { Permissions } from '@capacitor/core';

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
      const permissionStatus = await Permissions.query({ name: 'android.permission.READ_SMS' });
      return permissionStatus.state === 'granted';
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
      const permissionStatus = await Permissions.request({ name: 'android.permission.READ_SMS' });
      const granted = permissionStatus.state === 'granted';
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
