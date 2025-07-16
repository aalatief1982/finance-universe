import { checkForVendorUpdates } from './VendorSyncService';

class BackgroundVendorSyncService {
  private syncInterval: NodeJS.Timeout | null = null;
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized) return;
    
    this.isInitialized = true;
    
    // Run initial sync in background (non-blocking)
    setTimeout(() => {
      this.performSync();
    }, 2000); // Wait 2 seconds after app loads
    
    // Set up periodic sync every 30 minutes
    this.syncInterval = setInterval(() => {
      this.performSync();
    }, 30 * 60 * 1000);
  }

  private async performSync() {
    try {
      await checkForVendorUpdates();
      if (import.meta.env.MODE === 'development') {
        console.log('[BackgroundSync] Vendor data sync completed');
      }
    } catch (error) {
      if (import.meta.env.MODE === 'development') {
        console.warn('[BackgroundSync] Vendor sync failed:', error);
      }
    }
  }

  cleanup() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.isInitialized = false;
  }
}

export const backgroundVendorSyncService = new BackgroundVendorSyncService();