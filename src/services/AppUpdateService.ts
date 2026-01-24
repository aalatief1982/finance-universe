import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { CapacitorUpdater } from '@capgo/capacitor-updater';

type BundleInfo = {
  id: string;
  version?: string;
  status?: string;
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

// Simple synchronous getter - no caching of failures
const getUpdater = () => {
  if (!Capacitor.isNativePlatform()) {
    console.log('[OTA] Not native platform, skipping updater');
    return null;
  }
  console.log('[OTA] Returning CapacitorUpdater');
  return CapacitorUpdater;
};

class AppUpdateService {
  private isChecking = false;
  private isDownloading = false;
  private initialized = false;
  private initRetryTimer: ReturnType<typeof setTimeout> | null = null;

  private normalizeSemver(input: string): string {
    const raw = (input ?? '').trim();
    // Strip common prefixes like "v1.2.3" and grab the first semver-like sequence.
    const withoutPrefix = raw.replace(/^v/i, '');
    const match = withoutPrefix.match(/\d+(?:\.\d+){0,2}/);
    return match?.[0] ?? withoutPrefix;
  }

  private isBuiltinBundle(bundle?: BundleInfo | null): boolean {
    if (!bundle) return true;
    return bundle.id === 'builtin' || bundle.version === 'builtin';
  }

  private scheduleInitRetry(reason: unknown) {
    if (this.initRetryTimer != null) return;
    console.warn('[OTA] notifyAppReady failed; will retry shortly:', reason);
    this.initRetryTimer = globalThis.setTimeout(() => {
      this.initRetryTimer = null;
      void this.initialize();
    }, 500);
  }

  /**
   * Initialize the updater - MUST be called on app start
   */
  async initialize(): Promise<void> {
    console.log('[OTA] initialize() called, isNative:', Capacitor.isNativePlatform(), 'initialized:', this.initialized);
    
    if (!Capacitor.isNativePlatform() || this.initialized) {
      console.log('[OTA] Skipping init - not native or already initialized');
      return;
    }

    const updater = getUpdater();
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
      this.scheduleInitRetry(err);
    }
  }

  /**
   * Get current bundle version from Capgo
   */
  async getCurrentVersion(): Promise<string> {
    console.log('[OTA] getCurrentVersion() called');
    try {
      if (Capacitor.isNativePlatform()) {
        // Ensure we mark the running bundle as "ready" as early as possible.
        // If the bridge isn't ready yet, initialize() will retry.
        if (!this.initialized) {
          await this.initialize();
        }

        const updater = getUpdater();
        if (updater) {
          console.log('[OTA] Getting current bundle from Capgo...');
          const current = await updater.current();
          console.log('[OTA] Current bundle:', JSON.stringify(current.bundle));

          // Capgo may provide version in either `bundle.version` or (on some setups) as the `bundle.id`.
          // Falling back to native version here can cause an endless update loop after reload.
          if (!this.isBuiltinBundle(current.bundle)) {
            const candidate = current.bundle.version ?? current.bundle.id;
            const normalized = this.normalizeSemver(candidate ?? '');
            if (normalized) {
              console.log('[OTA] Using OTA bundle version (normalized):', normalized);
              return normalized;
            }
          }
        }
        const info = await App.getInfo();
        const nativeNormalized = this.normalizeSemver(info.version);
        console.log('[OTA] Using native app version (normalized):', nativeNormalized);
        return nativeNormalized;
      }
    } catch (err) {
      console.error('[OTA] Failed to get version:', err);
      // Avoid returning a tiny fallback on native, because it can create an endless
      // "update available" loop if Capgo.current() temporarily fails during startup.
      if (Capacitor.isNativePlatform()) {
        try {
          const info = await App.getInfo();
          const nativeNormalized = this.normalizeSemver(info.version);
          console.log('[OTA] Fallback to native app version (normalized):', nativeNormalized);
          return nativeNormalized;
        } catch {
          // ignore
        }
      }
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
    const normA = this.normalizeSemver(a);
    const normB = this.normalizeSemver(b);
    const partsA = normA.split('.').map((p) => Number.parseInt(p, 10) || 0);
    const partsB = normB.split('.').map((p) => Number.parseInt(p, 10) || 0);
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
      const updater = getUpdater();
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
      const updater = getUpdater();
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
      const updater = getUpdater();
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
      const updater = getUpdater();
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
      const updater = getUpdater();
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
