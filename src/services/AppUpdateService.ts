import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { App } from '@capacitor/app';
import { Preferences } from '@capacitor/preferences';
import JSZip from 'jszip';

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
const CURRENT_BUNDLE_KEY = 'ota_current_bundle';
const PREVIOUS_BUNDLE_KEY = 'ota_previous_bundle';
const UPDATE_DIR = 'updates';

class AppUpdateService {
  private isChecking = false;
  private isDownloading = false;

  /**
   * Get the current app version from Capacitor or localStorage fallback
   */
  async getCurrentVersion(): Promise<string> {
    try {
      if (Capacitor.isNativePlatform()) {
        const info = await App.getInfo();
        return info.version;
      }
    } catch (err) {
      if (import.meta.env.MODE === 'development') {
        console.warn('[AppUpdateService] Failed to get app info:', err);
      }
    }

    // Fallback to stored version
    const { value } = await Preferences.get({ key: CURRENT_BUNDLE_KEY });
    return value || '0.0.1';
  }

  /**
   * Fetch the remote manifest to check for updates
   */
  async fetchManifest(): Promise<UpdateManifest | null> {
    try {
      const response = await fetch(`${MANIFEST_URL}?t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      if (import.meta.env.MODE === 'development') {
        console.error('[AppUpdateService] Failed to fetch manifest:', err);
      }
      return null;
    }
  }

  /**
   * Compare version strings (semver-like)
   * Returns: 1 if a > b, -1 if a < b, 0 if equal
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
   * Check if an update is available
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

      // Check if native version is too old
      if (manifest.minimumNativeVersion) {
        let nativeVersion = currentVersion;
        
        if (Capacitor.isNativePlatform()) {
          try {
            const info = await App.getInfo();
            nativeVersion = info.version;
          } catch {
            // Use current version as fallback
          }
        }

        if (this.compareVersions(nativeVersion, manifest.minimumNativeVersion) < 0) {
          return {
            available: true,
            currentVersion,
            newVersion: manifest.version,
            manifest,
            requiresStoreUpdate: true
          };
        }
      }

      // Check if web bundle update is available
      const isNewer = this.compareVersions(manifest.version, currentVersion) > 0;

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
   * Download and apply the update
   */
  async downloadAndApplyUpdate(
    manifest: UpdateManifest,
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<boolean> {
    if (this.isDownloading) {
      return false;
    }

    this.isDownloading = true;

    try {
      if (import.meta.env.MODE === 'development') {
        console.log('[AppUpdateService] Starting download:', manifest.url);
      }

      // Download the zip file
      const response = await fetch(manifest.url);
      
      if (!response.ok) {
        throw new Error(`Download failed: HTTP ${response.status}`);
      }

      const contentLength = Number(response.headers.get('Content-Length')) || 0;
      const reader = response.body?.getReader();
      
      if (!reader) {
        throw new Error('Failed to get response reader');
      }

      // Read with progress
      const chunks: Uint8Array[] = [];
      let loaded = 0;

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        chunks.push(value);
        loaded += value.length;

        if (onProgress && contentLength > 0) {
          onProgress({
            loaded,
            total: contentLength,
            percent: Math.round((loaded / contentLength) * 100)
          });
        }
      }

      // Combine chunks
      const zipData = new Uint8Array(loaded);
      let position = 0;
      for (const chunk of chunks) {
        zipData.set(chunk, position);
        position += chunk.length;
      }

      if (import.meta.env.MODE === 'development') {
        console.log('[AppUpdateService] Download complete, extracting...');
      }

      // Extract the zip
      const zip = await JSZip.loadAsync(zipData);
      const updatePath = `${UPDATE_DIR}/${manifest.version}`;

      // Create update directory
      try {
        await Filesystem.mkdir({
          path: updatePath,
          directory: Directory.Data,
          recursive: true
        });
      } catch {
        // Directory might already exist
      }

      // Extract all files
      const files = Object.keys(zip.files);
      let extractedCount = 0;

      for (const filename of files) {
        const file = zip.files[filename];
        
        if (file.dir) {
          try {
            await Filesystem.mkdir({
              path: `${updatePath}/${filename}`,
              directory: Directory.Data,
              recursive: true
            });
          } catch {
            // Directory might exist
          }
        } else {
          const content = await file.async('base64');
          
          // Ensure parent directory exists
          const parentDir = filename.split('/').slice(0, -1).join('/');
          if (parentDir) {
            try {
              await Filesystem.mkdir({
                path: `${updatePath}/${parentDir}`,
                directory: Directory.Data,
                recursive: true
              });
            } catch {
              // Directory might exist
            }
          }

          await Filesystem.writeFile({
            path: `${updatePath}/${filename}`,
            data: content,
            directory: Directory.Data
          });
        }

        extractedCount++;
        
        if (onProgress) {
          onProgress({
            loaded: extractedCount,
            total: files.length,
            percent: Math.round((extractedCount / files.length) * 100)
          });
        }
      }

      if (import.meta.env.MODE === 'development') {
        console.log('[AppUpdateService] Extraction complete');
      }

      // Save previous bundle for rollback
      const { value: currentBundle } = await Preferences.get({ key: CURRENT_BUNDLE_KEY });
      if (currentBundle) {
        await Preferences.set({ key: PREVIOUS_BUNDLE_KEY, value: currentBundle });
      }

      // Set new bundle as current
      await Preferences.set({ key: CURRENT_BUNDLE_KEY, value: manifest.version });

      // Write a marker file for the native layer to know which bundle to load
      await Filesystem.writeFile({
        path: 'current_bundle.txt',
        data: manifest.version,
        directory: Directory.Data,
        encoding: Encoding.UTF8
      });

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
   * Rollback to previous bundle
   */
  async rollback(): Promise<boolean> {
    try {
      const { value: previousBundle } = await Preferences.get({ key: PREVIOUS_BUNDLE_KEY });
      
      if (!previousBundle) {
        return false;
      }

      await Preferences.set({ key: CURRENT_BUNDLE_KEY, value: previousBundle });
      
      await Filesystem.writeFile({
        path: 'current_bundle.txt',
        data: previousBundle,
        directory: Directory.Data,
        encoding: Encoding.UTF8
      });

      return true;
    } catch (err) {
      if (import.meta.env.MODE === 'development') {
        console.error('[AppUpdateService] Rollback failed:', err);
      }
      return false;
    }
  }

  /**
   * Clean up old update bundles to save space
   */
  async cleanupOldBundles(): Promise<void> {
    try {
      const { value: currentBundle } = await Preferences.get({ key: CURRENT_BUNDLE_KEY });
      const { value: previousBundle } = await Preferences.get({ key: PREVIOUS_BUNDLE_KEY });

      const result = await Filesystem.readdir({
        path: UPDATE_DIR,
        directory: Directory.Data
      });

      for (const file of result.files) {
        if (file.type === 'directory' && 
            file.name !== currentBundle && 
            file.name !== previousBundle) {
          try {
            await Filesystem.rmdir({
              path: `${UPDATE_DIR}/${file.name}`,
              directory: Directory.Data,
              recursive: true
            });
          } catch {
            // Ignore cleanup errors
          }
        }
      }
    } catch {
      // Ignore if updates directory doesn't exist
    }
  }

  /**
   * Get the path to the current bundle for native layer
   */
  async getCurrentBundlePath(): Promise<string | null> {
    try {
      const { value } = await Preferences.get({ key: CURRENT_BUNDLE_KEY });
      
      if (!value) return null;

      const result = await Filesystem.getUri({
        path: `${UPDATE_DIR}/${value}`,
        directory: Directory.Data
      });

      return result.uri;
    } catch {
      return null;
    }
  }
}

export const appUpdateService = new AppUpdateService();
