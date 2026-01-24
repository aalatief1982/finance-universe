import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

type BundleInfo = {
  id: string;
  version?: string;
  status?: string;
};

type CapacitorUpdaterType = {
  notifyAppReady: () => Promise<void>;
  current: () => Promise<{ bundle: BundleInfo }>;
  download: (options: { url: string; version: string }) => Promise<BundleInfo>;
  set: (bundle: BundleInfo) => Promise<void>;
  reset: () => Promise<void>;
  list: () => Promise<{ bundles: BundleInfo[] }>;
  delete: (options: { id: string }) => Promise<void>;
};

const CAPGO_MODULE = '@capgo/capacitor-updater';
let cachedUpdater: CapacitorUpdaterType | null | undefined;

const getUpdater = async (): Promise<CapacitorUpdaterType | null> => {
  console.log('[OTA] getUpdater called, platform:', Capacitor.getPlatform());
  
  if (!Capacitor.isNativePlatform()) {
    console.log('[OTA] Not native platform, skipping updater');
    return null;
  }
  
  if (cachedUpdater !== undefined) {
    console.log('[OTA] Returning cached updater:', cachedUpdater ? 'available' : 'null');
    return cachedUpdater;
  }

  try {
    console.log('[OTA] Attempting to import @capgo/capacitor-updater...');
    const mod = (await import(
      /* @vite-ignore */ CAPGO_MODULE
    )) as { CapacitorUpdater: CapacitorUpdaterType };
    cachedUpdater = mod.CapacitorUpdater;
    console.log('[OTA] Capgo updater loaded successfully');
    return cachedUpdater;
  } catch (err) {
    cachedUpdater = null;
    console.error('[OTA] Failed to load Capgo updater:', err);
    return null;
  }
};

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
    console.log('[OTA] initialize() called, isNative:', Capacitor.isNativePlatform(), 'initialized:', this.initialized);
    
    if (!Capacitor.isNativePlatform() || this.initialized) {
      console.log('[OTA] Skipping init - not native or already initialized');
      return;
    }

    const updater = await getUpdater();
    if (!updater) {
      console.log('[OTA] No updater available, skipping initialization');
      return;
    }

    try {
      console.log('[OTA] Calling notifyAppReady()...');
      await updater.notifyAppReady();
      this.initialized = true;
      console.log('[OTA] ✅ App marked as ready successfully');
    } catch (err) {
      console.error('[OTA] ❌ Failed to notify app ready:', err);
    }
  }

  /**
   * Get current bundle version from Capgo
   */
  async getCurrentVersion(): Promise<string> {
    console.log('[OTA] getCurrentVersion() called');
    try {
      if (Capacitor.isNativePlatform()) {
        const updater = await getUpdater();
        if (updater) {
          console.log('[OTA] Getting current bundle from Capgo...');
          const current = await updater.current();
          console.log('[OTA] Current bundle:', JSON.stringify(current.bundle));
          
          if (current.bundle.version && current.bundle.version !== 'builtin') {
            console.log('[OTA] Using OTA bundle version:', current.bundle.version);
            return current.bundle.version;
          }
        }
        const info = await App.getInfo();
        console.log('[OTA] Using native app version:', info.version);
        return info.version;
      }
    } catch (err) {
      console.error('[OTA] Failed to get version:', err);
    }
    console.log('[OTA] Returning fallback version: 0.0.1');
    return '0.0.1';
  }

  /**
   * Fetch manifest from Firebase
   */
  async fetchManifest(): Promise<UpdateManifest | null> {
    const url = `${MANIFEST_URL}?t=${Date.now()}`;
    console.log('[OTA] Fetching manifest from:', url);
    
    try {
      const response = await fetch(url, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      console.log('[OTA] Manifest response status:', response.status);
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const manifest = await response.json();
      console.log('[OTA] Manifest received:', JSON.stringify(manifest));
      return manifest;
    } catch (err) {
      console.error('[OTA] ❌ Failed to fetch manifest:', err);
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
    console.log('[OTA] checkForUpdates() called, isChecking:', this.isChecking);
    
    if (this.isChecking) {
      console.log('[OTA] Already checking, returning early');
      return { available: false, currentVersion: await this.getCurrentVersion() };
    }
    this.isChecking = true;

    try {
      const currentVersion = await this.getCurrentVersion();
      console.log('[OTA] Current version:', currentVersion);
      
      const manifest = await this.fetchManifest();

      if (!manifest) {
        console.log('[OTA] No manifest available');
        return { available: false, currentVersion };
      }

      // Check if native update required
      if (manifest.minimumNativeVersion) {
        try {
          const info = await App.getInfo();
          console.log('[OTA] Native version check:', info.version, 'vs minimum:', manifest.minimumNativeVersion);
          
          if (this.compareVersions(info.version, manifest.minimumNativeVersion) < 0) {
            console.log('[OTA] ⚠️ Native update required - current native version too old');
            return {
              available: true,
              currentVersion,
              newVersion: manifest.version,
              manifest,
              requiresStoreUpdate: true
            };
          }
        } catch (err) {
          console.warn('[OTA] Native version check failed:', err);
        }
      }

      const isNewer = this.compareVersions(manifest.version, currentVersion) > 0;
      
      console.log('[OTA] Version comparison:', {
        currentVersion,
        manifestVersion: manifest.version,
        isNewer,
        comparison: this.compareVersions(manifest.version, currentVersion)
      });

      const result = {
        available: isNewer,
        currentVersion,
        newVersion: manifest.version,
        manifest: isNewer ? manifest : undefined
      };
      
      console.log('[OTA] checkForUpdates result:', JSON.stringify(result));
      return result;
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
    console.log('[OTA] downloadAndApplyUpdate() called');
    console.log('[OTA] Manifest:', JSON.stringify(manifest));
    console.log('[OTA] isDownloading:', this.isDownloading);
    
    if (this.isDownloading) {
      console.log('[OTA] Already downloading, returning false');
      return false;
    }
    this.isDownloading = true;

    try {
      const updater = await getUpdater();
      if (!updater) {
        console.error('[OTA] ❌ Capgo updater not available for download');
        return false;
      }
      
      console.log('[OTA] Starting download from:', manifest.url);

      // Show initial progress
      if (onProgress) {
        onProgress({ loaded: 0, total: 100, percent: 0 });
      }

      // Download using Capgo (handles extraction internally)
      console.log('[OTA] Calling updater.download()...');
      const bundle: BundleInfo = await updater.download({
        url: manifest.url,
        version: manifest.version,
      });

      console.log('[OTA] ✅ Download complete, bundle:', JSON.stringify(bundle));

      // Show download complete
      if (onProgress) {
        onProgress({ loaded: 100, total: 100, percent: 100 });
      }

      // Apply the update - this will reload the WebView
      console.log('[OTA] Calling updater.set() to apply bundle...');
      await updater.set(bundle);
      console.log('[OTA] ✅ Bundle set successfully, WebView should reload');

      return true;
    } catch (err) {
      console.error('[OTA] ❌ Update failed:', err);
      console.error('[OTA] Error details:', JSON.stringify(err, Object.getOwnPropertyNames(err)));
      return false;
    } finally {
      this.isDownloading = false;
      console.log('[OTA] Download complete, isDownloading reset to false');
    }
  }

  /**
   * Rollback to previous bundle (builtin)
   */
  async rollback(): Promise<boolean> {
    console.log('[OTA] rollback() called');
    try {
      const updater = await getUpdater();
      if (!updater) {
        console.log('[OTA] No updater available for rollback');
        return false;
      }
      console.log('[OTA] Calling updater.reset()...');
      await updater.reset();
      console.log('[OTA] ✅ Rollback successful');
      return true;
    } catch (err) {
      console.error('[OTA] ❌ Rollback failed:', err);
      return false;
    }
  }

  /**
   * List all downloaded bundles
   */
  async listBundles(): Promise<BundleInfo[]> {
    try {
      const updater = await getUpdater();
      if (!updater) return [];
      const result = await updater.list();
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
      const updater = await getUpdater();
      if (!updater) return;
      const { bundles } = await updater.list();
      const current = await updater.current();

      for (const bundle of bundles) {
        if (bundle.id !== current.bundle.id && bundle.status !== 'pending') {
          try {
            await updater.delete({ id: bundle.id });
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
      const updater = await getUpdater();
      if (!updater) {
        return {
          currentBundle: null,
          allBundles: [],
          nativeVersion: '0.0.0'
        };
      }
      const current = await updater.current();
      const { bundles } = await updater.list();
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
