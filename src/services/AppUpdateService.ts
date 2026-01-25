import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { safeStorage } from '@/utils/safe-storage';
type CapacitorUpdaterType = typeof import('@capgo/capacitor-updater').CapacitorUpdater;

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
const PENDING_BUNDLE_STORAGE_KEY = 'xpensia_pending_update_bundle';

let updaterPromise: Promise<CapacitorUpdaterType | null> | null = null;

const getUpdater = async (): Promise<CapacitorUpdaterType | null> => {
  if (!Capacitor.isNativePlatform()) {
    console.log('[OTA] Not native platform, skipping updater');
    return null;
  }
  if (!updaterPromise) {
    updaterPromise = import('@capgo/capacitor-updater')
      .then((module) => {
        console.log('[OTA] Returning CapacitorUpdater');
        return module.CapacitorUpdater;
      })
      .catch((err) => {
        console.error('[OTA] Failed to load CapacitorUpdater:', err);
        return null;
      });
  }
  return updaterPromise;
};

class AppUpdateService {
  private isChecking = false;
  private isDownloading = false;
  private initialized = false;
  private initializeInFlight: Promise<void> | null = null;
  private pendingBundle: BundleInfo | null = null;

  private readPendingBundleFromStorage(): BundleInfo | null {
    try {
      const raw = safeStorage.getItem(PENDING_BUNDLE_STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as BundleInfo;
    } catch {
      return null;
    }
  }

  private getPendingBundleInternal(): BundleInfo | null {
    if (this.pendingBundle) return this.pendingBundle;
    const stored = this.readPendingBundleFromStorage();
    if (stored) {
      this.pendingBundle = stored;
    }
    return this.pendingBundle;
  }

  private setPendingBundle(bundle: BundleInfo | null) {
    this.pendingBundle = bundle;
    if (!bundle) {
      safeStorage.removeItem(PENDING_BUNDLE_STORAGE_KEY);
      return;
    }
    safeStorage.setItem(PENDING_BUNDLE_STORAGE_KEY, JSON.stringify(bundle));
  }

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

  // Removed retry logic - we now mark as initialized even on error to prevent blocking

  /**
   * Initialize the updater - MUST be called on app start
   */
  async initialize(): Promise<void> {
    console.log('[OTA] initialize() called, isNative:', Capacitor.isNativePlatform(), 'initialized:', this.initialized);
    
    if (this.initializeInFlight) {
      console.log('[OTA] Init already in flight, waiting...');
      await this.initializeInFlight;
      return;
    }

    if (!Capacitor.isNativePlatform()) {
      console.log('[OTA] Skipping init - not native platform');
      return;
    }
    
    if (this.initialized) {
      console.log('[OTA] Already initialized, skipping');
      return;
    }

    this.initializeInFlight = (async () => {
      console.log('[OTA] Loading Capgo updater...');
      const updater = await getUpdater();
      if (!updater) {
        console.log('[OTA] No updater available, marking as initialized anyway');
        // Mark as initialized so version checks can proceed with native fallback
        this.initialized = true;
        return;
      }

      try {
        console.log('[OTA] Calling notifyAppReady()...');
        await updater.notifyAppReady();
        this.initialized = true;
        console.log('[OTA] ✅ App marked as ready successfully');
      } catch (err) {
        console.error('[OTA] ❌ Failed to notify app ready:', err);
        // Mark as initialized anyway to prevent blocking update checks
        // The next app restart will try notifyAppReady again
        this.initialized = true;
        console.log('[OTA] ⚠️ Continuing despite error - version checks will use native fallback');
      }
    })();

    try {
      await this.initializeInFlight;
    } finally {
      this.initializeInFlight = null;
    }
  }

  /**
   * Get current bundle version from Capgo
   */
  async getCurrentVersion(): Promise<string> {
    console.log('[OTA] getCurrentVersion() called');
    try {
      if (Capacitor.isNativePlatform()) {
        // Ensure initialization runs first
        if (!this.initialized) {
          console.log('[OTA] Not initialized yet, initializing...');
          await this.initialize();
        }

        // Try to get Capgo bundle version
        try {
          const updater = await getUpdater();
          if (updater) {
            console.log('[OTA] Getting current bundle from Capgo...');
            const current = await updater.current();
            console.log('[OTA] Current bundle:', JSON.stringify(current.bundle));

            // Capgo may provide version in either `bundle.version` or `bundle.id`
            if (!this.isBuiltinBundle(current.bundle)) {
              const candidate = current.bundle.version ?? current.bundle.id;
              const normalized = this.normalizeSemver(candidate ?? '');
              if (normalized) {
                console.log('[OTA] Using OTA bundle version (normalized):', normalized);
                return normalized;
              }
            }
          }
        } catch (capgoErr) {
          console.warn('[OTA] Capgo bundle fetch failed, using native fallback:', capgoErr);
        }
        
        // Fallback to native version
        const info = await App.getInfo();
        const nativeNormalized = this.normalizeSemver(info.version);
        console.log('[OTA] Using native app version (normalized):', nativeNormalized);
        return nativeNormalized;
      }
    } catch (err) {
      console.error('[OTA] Failed to get version:', err);
      // Final fallback for native
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
    console.log('[OTA] checkForUpdates() called, isChecking:', this.isChecking, 'initialized:', this.initialized);
    
    // Ensure initialization has run first
    if (!this.initialized && Capacitor.isNativePlatform()) {
      console.log('[OTA] ⏳ Waiting for initialization before checking updates...');
      await this.initialize();
      // Note: initialize() now always marks initialized=true to prevent blocking
    }
    
    if (this.isChecking) {
      console.log('[OTA] Already checking, returning early');
      const currentVersion = await this.getCurrentVersion();
      return { available: false, currentVersion };
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

      // Check if this version is already downloaded/pending - skip showing dialog again
      const alreadyPending = await this.hasPendingBundle(manifest.version);
      if (alreadyPending) {
        console.log('[OTA] Update already downloaded, waiting for next app launch');
        return {
          available: false,
          currentVersion,
          newVersion: manifest.version,
        };
      }

      const isNewer = this.compareVersions(manifest.version, currentVersion) > 0;
      
      console.log('[OTA] Version comparison:', {
        currentVersion,
        manifestVersion: manifest.version,
        isNewer,
        comparison: this.compareVersions(manifest.version, currentVersion)
      });

      const pending = this.getPendingBundleInternal();
      if (pending?.version === manifest.version) {
        console.log('[OTA] Pending bundle already downloaded for this version');
        return {
          available: false,
          currentVersion,
          newVersion: manifest.version,
          manifest
        };
      }

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
   * Check if we have a pending bundle ready to apply
   */
  async hasPendingBundle(targetVersion?: string): Promise<boolean> {
    try {
      // Check in-memory pending first
      const pending = this.getPendingBundleInternal();
      if (pending) {
        if (!targetVersion || pending.version === targetVersion) {
          return true;
        }
      }
      
      const updater = await getUpdater();
      if (!updater) return false;
      
      const { bundles } = await updater.list();
      
      // Check if any bundle matches target version or has pending status
      return bundles.some(b => 
        (targetVersion && b.version === targetVersion) ||
        b.status === 'pending'
      );
    } catch {
      return false;
    }
  }

  /**
   * Get the pending bundle if any
   */
  getPendingBundle(): BundleInfo | null {
    return this.getPendingBundleInternal();
  }

  /**
   * Download update (does NOT apply immediately - deferred to next launch)
   */
  async downloadUpdate(
    manifest: UpdateManifest,
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<BundleInfo | null> {
    console.log('[OTA] downloadUpdate() called (download-only mode)');
    console.log('[OTA] Manifest:', JSON.stringify(manifest));
    console.log('[OTA] isDownloading:', this.isDownloading);
    
    // Check if already downloaded
    const alreadyPending = await this.hasPendingBundle(manifest.version);
    if (alreadyPending) {
      console.log('[OTA] Bundle already downloaded, skipping re-download');
      return { id: 'already-pending', version: manifest.version };
    }
    
    if (this.isDownloading) {
      console.log('[OTA] Already downloading, returning null');
      return null;
    }
    this.isDownloading = true;

    try {
      const updater = await getUpdater();
      if (!updater) {
        console.error('[OTA] ❌ Capgo updater not available for download');
        return null;
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

      // Store as pending - DO NOT call set() here
      this.setPendingBundle(bundle);
      console.log('[OTA] Bundle downloaded and marked as pending:', bundle.version);
      
      return bundle;
    } catch (err) {
      console.error('[OTA] ❌ Download failed:', err);
      console.error('[OTA] Error details:', JSON.stringify(err, Object.getOwnPropertyNames(err)));
      return null;
    } finally {
      this.isDownloading = false;
      console.log('[OTA] Download complete, isDownloading reset to false');
    }
  }

  /**
   * Apply a pending bundle (call on next launch)
   */
  async applyPendingBundle(): Promise<boolean> {
    console.log('[OTA] applyPendingBundle() called');
    
    const updater = await getUpdater();
    if (!updater) {
      console.log('[OTA] No updater available');
      return false;
    }
    
    const pending = this.getPendingBundleInternal();
    if (!pending) {
      console.log('[OTA] No pending bundle to apply');
      return false;
    }

    try {
      const current = await updater.current();
      if (
        pending.id &&
        (pending.id === current.bundle.id || pending.version === current.bundle.version)
      ) {
        console.log('[OTA] Pending bundle already active, clearing flag');
        this.setPendingBundle(null);
        return false;
      }

      console.log('[OTA] Applying pending bundle:', pending.version);
      this.setPendingBundle(null);
      await updater.set(pending);
      console.log('[OTA] ✅ Bundle applied, will be active on next launch');
      return true;
    } catch (err) {
      console.error('[OTA] ❌ Failed to apply bundle:', err);
      this.setPendingBundle(pending);
      return false;
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
