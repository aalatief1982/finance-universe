import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

/**
 * Write the provided CSV data to the native filesystem and
 * present the platform share dialog so users can export the file.
 *
 * Returns true if the export completed successfully.
 */
export async function exportCsvViaShare(csv: string): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;

  const fileName = 'transactions.csv';

  try {
    await Filesystem.writeFile({
      path: fileName,
      data: csv,
      directory: Directory.Documents,
    });

    const { uri } = await Filesystem.getUri({
      path: fileName,
      directory: Directory.Documents,
    });

    await Share.share({
      title: 'Export transactions',
      url: uri,
    });

    return true;
  } catch (err) {
    console.error('[exportCsvViaShare] Failed to export file:', err);
    throw err;
  }
}
