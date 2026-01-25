import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { safeStorage } from '@/utils/safe-storage';
import { CapacitorUpdater } from '@capgo/capacitor-updater';

type CapacitorUpdaterType = typeof CapacitorUpdater;

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

export interface OTADebugInfo {
  nativeVersion: string;
  currentBundle: BundleInfo | null;
  pendingBundle: BundleInfo | null;
  allBundles: BundleInfo[];
  initialized: boolean;
  lastManifestCheck: string | null;
  lastManifestVersion: string | null;
}

const MANIFEST_URL = 'https://xpensia-505ac.web.app/manifest.json';
const PENDING_BUNDLE_STORAGE_KEY = 'xpensia_pending_update_bundle';
const LAST_MANIFEST_CHECK_KEY = 'xpensia_last_manifest_check';
const LAST_MANIFEST_VERSION_KEY = 'xpensia_last_manifest_version';

const withTimeout = async <T,>(
  promise: Promise<T>,
  ms: number,
  label: string,
): Promise<T> => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`[OTA] Timeout: ${label} after ${ms}ms`));
    }, ms);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timer) clearTimeout(timer);
  }
};

const getUpdater = (): CapacitorUpdaterType | null => {
  if (!Capacitor.isNativePlatform()) {
    return null;
  }
  return CapacitorUpdater;
};

class AppUpdateService {
  private isChecking = false;
  private isDownloading = false;
  private initialized = false;
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
    const withoutPrefix = raw.replace(/^v/i, '');
    const match = withoutPrefix.match(/\d+(?:\.\d+){0,2}/);
    return match?.[0] ?? withoutPrefix;
  }

  private isBuiltinBundle(bundle?: BundleInfo | null): boolean {
    if (!bundle) return true;
    return bundle.id === 'builtin' || bundle.version === 'builtin';
  }

  /**
   * Initialize the updater - fire-and-forget, never blocks.
   * Call this on app start but don't await it in critical paths.
   */
  async initialize(): Promise<void> {
    console.log('[OTA] initialize() called, isNative:', Capacitor.isNativePlatform());

    if (!Capacitor.isNativePlatform()) {
      console.log('[OTA] Skipping init - not native platform');
      this.initialized = true;
      return;
    }

    if (this.initialized) {
      console.log('[OTA] Already initialized');
      return;
    }

    // Mark initialized immediately to prevent blocking
    this.initialized = true;

    const updater = getUpdater();
    if (!updater) {
      console.log('[OTA] No updater available');
      return;
    }

    try {
      console.log('[OTA] Calling notifyAppReady()...');
      await withTimeout(updater.notifyAppReady(), 3000, 'notifyAppReady');
      console.log('[OTA] ✅ App marked as ready');
    } catch (err) {
      console.warn('[OTA] ⚠️ notifyAppReady failed (non-blocking):', err);
      // Continue anyway - the service is still usable
    }

    // Call applyPendingBundle to apply any downloaded updates
    try {
      const applied = await this.applyPendingBundle();
      if (applied) {
        console.log('[OTA] ✅ Pending bundle applied successfully');
      } else {
        console.log('[OTA] No pending bundle to apply');
      }
    } catch (err) {
      console.error('[OTA] ❌ Failed to apply pending bundle:', err);
    }
  }

  /**
   * Get current version - NEVER blocks, always returns quickly
   */
  async getCurrentVersion(): Promise<string> {
    console.log('[OTA] getCurrentVersion() called');
    
    // Always try native first for immediate response
    let nativeVersion = '1.0.0';
    try {
      const info = await withTimeout(App.getInfo(), 1500, 'App.getInfo');
      nativeVersion = this.normalizeSemver(info.version);
      console.log('[OTA] Native version:', nativeVersion);
    } catch (err) {
      console.warn('[OTA] Failed to get native version:', err);
    }
    // Try to get OTA bundle version (with short timeout)
    try {
      const updater = getUpdater();
      if (updater) {
        const current = await withTimeout(updater.current(), 1500, 'updater.current');
        console.log('[OTA] Current bundle:', JSON.stringify(current.bundle));
        if (!this.isBuiltinBundle(current.bundle)) {
          const candidate = current.bundle.version ?? current.bundle.id;
          const normalized = this.normalizeSemver(candidate ?? '');
          if (normalized && normalized !== 'builtin') {
            console.log('[OTA] Using OTA bundle version:', normalized);
            return normalized;
          }
        }
      }
    } catch (err) {
      console.warn('[OTA] Capgo bundle fetch failed, using native:', err);
    }
    console.log('[OTA] Returning native version:', nativeVersion);
    return nativeVersion;
  }

  /**
   * Get native app version only (fast, no OTA check)
   */
  async getNativeVersion(): Promise<string> {
    try {
      const info = await withTimeout(App.getInfo(), 1500, 'App.getInfo');
      return this.normalizeSemver(info.version);
    } catch {
      return '1.0.0';
    }
  }

  /**
   * Fetch manifest from Firebase
   */
  async fetchManifest(): Promise<UpdateManifest | null> {
    const url = MANIFEST_URL; // Use the full URL directly
    console.log('[OTA] Fetching manifest from:', url);

    try {
      const controller = new AbortController();
      const abortTimer = setTimeout(() => controller.abort(), 8000);
      const response = await fetch(url, {
        method: 'GET',
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
        signal: controller.signal,
      }).finally(() => clearTimeout(abortTimer));

      console.log('[OTA] Manifest response status:', response.status);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const manifest = await response.json();
      console.log('[OTA] Manifest received:', JSON.stringify(manifest));
      // Store last manifest info
      safeStorage.setItem(LAST_MANIFEST_CHECK_KEY, new Date().toISOString());
      safeStorage.setItem(LAST_MANIFEST_VERSION_KEY, manifest.version);
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
   * Check for available updates - NEVER blocks on initialization
   */
  async checkForUpdates(): Promise<UpdateStatus> {
    console.log('[OTA] checkForUpdates() called');

    // Start initialization in background (don't wait)
    if (!this.initialized) {
      this.initialize().catch(() => {});
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
          const nativeVersion = await this.getNativeVersion();
          console.log('[OTA] Native version check:', nativeVersion, 'vs minimum:', manifest.minimumNativeVersion);

          if (this.compareVersions(nativeVersion, manifest.minimumNativeVersion) < 0) {
            console.log('[OTA] ⚠️ Native update required');
            return {
              available: true,
              currentVersion,
              newVersion: manifest.version,
              manifest,
              requiresStoreUpdate: true,
            };
          }
        } catch (err) {
          console.warn('[OTA] Native version check failed:', err);
        }
      }

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
      });

      const result = {
        available: isNewer,
        currentVersion,
        newVersion: manifest.version,
        manifest: isNewer ? manifest : undefined,
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
      const pending = this.getPendingBundleInternal();
      if (pending) {
        if (!targetVersion || pending.version === targetVersion) {
          return true;
        }
      }

      const updater = getUpdater();
      if (!updater) return false;

      const { bundles } = await withTimeout(updater.list(), 3000, 'updater.list');

      return bundles.some(
        (b) => (targetVersion && b.version === targetVersion) || b.status === 'pending'
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
   * Clear pending bundle
   */
  clearPendingBundle(): void {
    this.setPendingBundle(null);
  }
  /**
   * Download update (does NOT apply immediately - deferred to next launch).
   */
  async downloadUpdate(
    manifest: UpdateManifest,
  ): Promise<BundleInfo | null> {
    console.log('[OTA] downloadUpdate() called');
    console.log('[OTA] Manifest:', JSON.stringify(manifest));

    const alreadyPending = await this.hasPendingBundle(manifest.version);
    if (alreadyPending) {
      console.log('[OTA] Bundle already downloaded, skipping');
      return { id: 'already-pending', version: manifest.version };
    }

    if (this.isDownloading) {
      console.log('[OTA] Already downloading');
      return null;
    }
    this.isDownloading = true;
    
    try {
      const updater = getUpdater();
      if (!updater) {
        console.error('[OTA] ❌ No updater available');
        return null;
      }

      console.log('[OTA] Starting download from:', manifest.url);

      const bundle: BundleInfo = await updater.download({
        url: manifest.url,
        version: manifest.version,
      });

      // Verify download completion
      if (bundle.status !== 'success') {
        console.error('[OTA] ❌ Download did not complete successfully:', bundle);
        return null;
      }

      console.log('[OTA] ✅ Download complete:', JSON.stringify(bundle));

      this.setPendingBundle(bundle);
      console.log('[OTA] Bundle marked as pending');

      // Log the list of bundles for debugging
      try {
        const { bundles } = await updater.list();
        console.log('[OTA] Current bundles after download:', JSON.stringify(bundles));
      } catch (err) {
        console.warn('[OTA] Failed to list bundles after download:', err);
      }

      // Ensure the download is fully complete before applying
      const applied = await this.applyPendingBundle();
      if (applied) {
        console.log('[OTA] ✅ Bundle applied immediately after download');
        if (updater.reload) {
          console.log('[OTA] Triggering WebView reload');
          await updater.reload();
        } else {
          console.warn('[OTA] WebView reload not supported');
        }
      } else {
        console.log('[OTA] Bundle will be applied on next app launch');
      }

      return bundle;
    } catch (err) {
      console.error('[OTA] ❌ Download failed:', err);
      return null;
    } finally {
      this.isDownloading = false;
    }
  }

  /**
   * Apply a pending bundle (call when app is backgrounded)
   */
  async applyPendingBundle(): Promise<boolean> {
    console.log('[OTA] applyPendingBundle() called');

    const updater = getUpdater();
    if (!updater) {
      console.log('[OTA] No updater available');
      return false;
    }

    const pending = this.getPendingBundleInternal();
    if (!pending) {
      console.log('[OTA] No pending bundle');
      return false;
    }

    try {
      const current = await withTimeout(updater.current(), 2000, 'updater.current');
      if (pending.id && (pending.id === current.bundle.id || pending.version === current.bundle.version)) {
        console.log('[OTA] Pending bundle already active');
        this.setPendingBundle(null);
        return false;
      }

      console.log('[OTA] Applying bundle:', pending.version);

      // Attempt to activate the pending bundle
      if (pending.status === 'pending') {
        console.log('[OTA] Activating pending bundle:', pending.id);
        await withTimeout(updater.set(pending), 8000, 'updater.set');
        console.log('[OTA] ✅ Pending bundle activated');
      } else {
        console.warn('[OTA] Bundle status is not pending, skipping activation:', pending.status);
      }

      console.log('[OTA] ✅ Bundle applied');
      return true;
    } catch (err) {
      console.error('[OTA] ❌ Apply failed:', err);
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
      const updater = getUpdater();
      if (!updater) return false;
      
      await withTimeout(updater.reset(), 8000, 'updater.reset');
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
      const result = await withTimeout(updater.list(), 3000, 'updater.list');
      return result.bundles;
    } catch {
      return [];
    }
  }

  /**
   * Get comprehensive debug info for troubleshooting
   */
  async getDebugInfo(): Promise<OTADebugInfo> {
    const result: OTADebugInfo = {
      nativeVersion: '0.0.0',
      currentBundle: null,
      pendingBundle: this.getPendingBundleInternal(),
      allBundles: [],
      initialized: this.initialized,
      lastManifestCheck: safeStorage.getItem(LAST_MANIFEST_CHECK_KEY),
      lastManifestVersion: safeStorage.getItem(LAST_MANIFEST_VERSION_KEY),
    };
    try {
      result.nativeVersion = await this.getNativeVersion();
    } catch {}
    try {
      const updater = getUpdater();
      if (updater) {
        const current = await withTimeout(updater.current(), 2000, 'updater.current');
        result.currentBundle = current.bundle;
        
        const { bundles } = await withTimeout(updater.list(), 3000, 'updater.list');
        result.allBundles = bundles;
      }
    } catch {}
    return result;
  }

  /**
   * Manual update check (for debug UI)
   */
  async manualCheckForUpdates(): Promise<UpdateStatus> {
    this.isChecking = false; // Reset flag to force check
    return this.checkForUpdates();
  }
}

export const appUpdateService = new AppUpdateService();
