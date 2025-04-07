
// Service for handling SMS permission status
class SmsPermissionService {
  private permissionGranted: boolean = false;

  constructor() {
    // Initialize permission status from localStorage
    this.permissionGranted = localStorage.getItem('smsPermissionGranted') === 'true';
  }

  // Check if SMS permission is granted
  hasPermission(): boolean {
    return this.permissionGranted;
  }

  // Save permission status
  savePermissionStatus(status: boolean): void {
    this.permissionGranted = status;
    localStorage.setItem('smsPermissionGranted', status ? 'true' : 'false');
  }

  // Request SMS permission (simulated for web)
  async requestPermission(): Promise<boolean> {
    // In a real app, this would use Capacitor or other native APIs
    // to request permission from the device
    
    // Simulate permission request dialog
    if (window.confirm("Allow app to read SMS messages for transaction tracking?")) {
      this.permissionGranted = true;
      this.savePermissionStatus(true);
      return true;
    } else {
      this.permissionGranted = false;
      this.savePermissionStatus(false);
      return false;
    }
  }

  // Check if running in a native environment (not web)
  isNativeEnvironment(): boolean {
    // In a real app, this would check if Capacitor or Cordova is available
    // For now, always return false since we're in web
    return false;
  }
}

// Create singleton instance
export const smsPermissionService = new SmsPermissionService();
