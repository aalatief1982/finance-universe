/**
 * @file BackgroundVendorSyncService.ts
 * @description Background scheduler for vendor sync updates.
 *
 * @module services/BackgroundVendorSyncService
 *
 * @responsibilities
 * 1. Schedule periodic vendor sync checks
 * 2. Dispatch UI update events on sync completion
 * 3. Manage lifecycle cleanup for intervals and callbacks
 *
 * @dependencies
 * - VendorSyncService.ts: sync and callback registration
 *
 * @review-tags
 * - @side-effects: sets intervals and dispatches browser events
 * - @risk: multiple initialization leading to duplicate intervals
 *
 * @review-checklist
 * - [ ] initialize is idempotent
 * - [ ] cleanup clears interval and subscriptions
 * - [ ] sync failures are handled gracefully
 */

import { checkForVendorUpdates, onSyncComplete } from './VendorSyncService';

class BackgroundVendorSyncService {
  private syncInterval: NodeJS.Timeout | null = null;
  private isInitialized = false;
  private unsubscribeFromSync: (() => void) | null = null;

  async initialize() {
    if (this.isInitialized) return;
    
    this.isInitialized = true;
    
    // Subscribe to sync completion events
    this.unsubscribeFromSync = onSyncComplete((success, updatedData) => {
      if (success && updatedData) {
        if (import.meta.env.MODE === 'development') {
          // console.log('[BackgroundSync] Vendor data updated successfully');
        }
        // Dispatch custom event for real-time UI updates
        window.dispatchEvent(new CustomEvent('vendorDataUpdated', { 
          detail: { vendorData: updatedData } 
        }));
      }
    });
    
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
        // console.log('[BackgroundSync] Vendor data sync completed');
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
    if (this.unsubscribeFromSync) {
      this.unsubscribeFromSync();
      this.unsubscribeFromSync = null;
    }
    this.isInitialized = false;
  }
}

export const backgroundVendorSyncService = new BackgroundVendorSyncService();
