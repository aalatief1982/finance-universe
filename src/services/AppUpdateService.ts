import { Capacitor } from '@capacitor/core';
import { CapacitorUpdater, BundleInfo } from '@capgo/capacitor-updater';
import { App } from '@capacitor/app';

export interface UpdateManifest {
  version: string;
  minimumNativeVersion?: string;
  url: string;
  releaseNotes?: string;
  mandatory?: boolean;
  checksum?: string;
}

export interface UpdateStatus {
  available: boolean;
  currentVersion: string;
  newVersion?: string;
  manifest?: UpdateManifest;
  requiresStoreUpdate?: boolean;
}

export interface DownloadProgress {
  loaded: number;
  total: number;
  percent: number;
}

const MANIFEST_URL = 'https://xpensia-505ac.web.app/manifest.json';

class AppUpdateService {
  private isChecking = false;
  private isDownloading = false;
  private initialized = false;

  /**
   * Initialize the updater - MUST be called on app start
   */
  async initialize(): Promise<void> {
    if (!Capacitor.isNativePlatform() || this.initialized) return;

    try {
      // Tell Capgo the app loaded successfully (prevents auto-rollback)
      await CapacitorUpdater.notifyAppReady();
      this.initialized = true;
      if (import.meta.env.MODE === 'development') {
        console.log('[AppUpdateService] App marked as ready');
      }
    } catch (err) {
      if (import.meta.env.MODE === 'development') {
        console.error('[AppUpdateService] Failed to notify app ready:', err);
      }
    }
  }

  /**
   * Get current bundle version from Capgo
   */
  async getCurrentVersion(): Promise<string> {
    try {
      if (Capacitor.isNativePlatform()) {
        const current = await CapacitorUpdater.current();
        // If we have a downloaded bundle, use its version
        if (current.bundle.version && current.bundle.version !== 'builtin') {
          return current.bundle.version;
        }
        // Otherwise fall back to native app version
        const info = await App.getInfo();
        return info.version;
      }
    } catch (err) {
      if (import.meta.env.MODE === 'development') {
        console.warn('[AppUpdateService] Failed to get version:', err);
      }
    }
    return '0.0.1';
  }

  /**
   * Fetch manifest from Firebase
   */
  async fetchManifest(): Promise<UpdateManifest | null> {
    try {
      const response = await fetch(`${MANIFEST_URL}?t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (err) {
      if (import.meta.env.MODE === 'development') {
        console.error('[AppUpdateService] Failed to fetch manifest:', err);
      }
      return null;
    }
  }

  /**
   * Compare semver versions
   */
  compareVersions(a: string, b: string): number {
    const partsA = a.split('.').map(Number);
    const partsB = b.split('.').map(Number);
    for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
      const numA = partsA[i] || 0;
      const numB = partsB[i] || 0;
      if (numA > numB) return 1;
      if (numA < numB) return -1;
    }
    return 0;
  }

  /**
   * Check for available updates
   */
  async checkForUpdates(): Promise<UpdateStatus> {
    if (this.isChecking) {
      return { available: false, currentVersion: await this.getCurrentVersion() };
    }
    this.isChecking = true;

    try {
      const currentVersion = await this.getCurrentVersion();
      const manifest = await this.fetchManifest();

      if (!manifest) {
        return { available: false, currentVersion };
      }

      // Check if native update required
      if (manifest.minimumNativeVersion) {
        try {
          const info = await App.getInfo();
          if (this.compareVersions(info.version, manifest.minimumNativeVersion) < 0) {
            return {
              available: true,
              currentVersion,
              newVersion: manifest.version,
              manifest,
              requiresStoreUpdate: true
            };
          }
        } catch {
          // Continue with OTA check if native version check fails
        }
      }

      const isNewer = this.compareVersions(manifest.version, currentVersion) > 0;
      
      if (import.meta.env.MODE === 'development') {
        console.log('[AppUpdateService] Version check:', {
          currentVersion,
          manifestVersion: manifest.version,
          isNewer
        });
      }

      return {
        available: isNewer,
        currentVersion,
        newVersion: manifest.version,
        manifest: isNewer ? manifest : undefined
      };
    } finally {
      this.isChecking = false;
    }
  }

  /**
   * Download and apply update using Capgo
   */
  async downloadAndApplyUpdate(
    manifest: UpdateManifest,
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<boolean> {
    if (this.isDownloading) return false;
    this.isDownloading = true;

    try {
      if (import.meta.env.MODE === 'development') {
        console.log('[AppUpdateService] Downloading:', manifest.url);
      }

      // Show initial progress
      if (onProgress) {
        onProgress({ loaded: 0, total: 100, percent: 0 });
      }

      // Download using Capgo (handles extraction internally)
      const bundle: BundleInfo = await CapacitorUpdater.download({
        url: manifest.url,
        version: manifest.version,
      });

      if (import.meta.env.MODE === 'development') {
        console.log('[AppUpdateService] Downloaded bundle:', bundle.id);
      }

      // Show download complete
      if (onProgress) {
        onProgress({ loaded: 100, total: 100, percent: 100 });
      }

      // Apply the update - this will reload the WebView
      await CapacitorUpdater.set(bundle);

      return true;
    } catch (err) {
      if (import.meta.env.MODE === 'development') {
        console.error('[AppUpdateService] Update failed:', err);
      }
      return false;
    } finally {
      this.isDownloading = false;
    }
  }

  /**
   * Rollback to previous bundle (builtin)
   */
  async rollback(): Promise<boolean> {
    try {
      await CapacitorUpdater.reset();
      return true;
    } catch (err) {
      if (import.meta.env.MODE === 'development') {
        console.error('[AppUpdateService] Rollback failed:', err);
      }
      return false;
    }
  }

  /**
   * List all downloaded bundles
   */
  async listBundles(): Promise<BundleInfo[]> {
    try {
      const result = await CapacitorUpdater.list();
      return result.bundles;
    } catch {
      return [];
    }
  }

  /**
   * Clean up old bundles to save space
   */
  async cleanupOldBundles(): Promise<void> {
    try {
      const { bundles } = await CapacitorUpdater.list();
      const current = await CapacitorUpdater.current();

      for (const bundle of bundles) {
        if (bundle.id !== current.bundle.id && bundle.status !== 'pending') {
          try {
            await CapacitorUpdater.delete({ id: bundle.id });
          } catch {
            // Ignore individual cleanup errors
          }
        }
      }
    } catch (err) {
      if (import.meta.env.MODE === 'development') {
        console.warn('[AppUpdateService] Cleanup failed:', err);
      }
    }
  }

  /**
   * Get debug info about current update state
   */
  async getDebugInfo(): Promise<{
    currentBundle: BundleInfo | null;
    allBundles: BundleInfo[];
    nativeVersion: string;
  }> {
    try {
      const current = await CapacitorUpdater.current();
      const { bundles } = await CapacitorUpdater.list();
      const info = await App.getInfo();

      return {
        currentBundle: current.bundle,
        allBundles: bundles,
        nativeVersion: info.version
      };
    } catch {
      return {
        currentBundle: null,
        allBundles: [],
        nativeVersion: '0.0.0'
      };
    }
  }
}

export const appUpdateService = new AppUpdateService();
