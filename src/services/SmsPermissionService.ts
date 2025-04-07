
class SmsPermissionService {
  private permissionKey = 'sms_permission_granted';
  
  /**
   * Check if we're in a native mobile environment
   */
  isNativeEnvironment(): boolean {
    // In a real app, this would check for Capacitor or Cordova
    // For demo purposes, check if we're on a mobile device
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
  }
  
  /**
   * Check if SMS permission has been granted
   */
  hasPermission(): boolean {
    // In a real app, this would check with Capacitor's Permissions API
    // For demo purposes, check localStorage
    return localStorage.getItem(this.permissionKey) === 'true';
  }
  
  /**
   * Request SMS permission
   * @returns Promise resolving to boolean indicating if permission was granted
   */
  async requestPermission(): Promise<boolean> {
    // In a real app, this would use Capacitor's Permissions API
    // For demo purposes, simulate a permission request
    
    // If we're not in a native environment, always deny
    if (!this.isNativeEnvironment()) {
      return false;
    }
    
    // Simulate a delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Always grant for demo
    localStorage.setItem(this.permissionKey, 'true');
    return true;
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
