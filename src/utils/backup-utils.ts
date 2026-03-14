export const XPENSIA_BACKUP_VERSION = 1;

export interface XpensiaBackupFile {
  xpensiaBackupVersion: number;
  createdAt: string;
  appVersion: string;
  platform: string;
  data: Record<string, string>;
}

const XPENSIA_KEY_PREFIX = 'xpensia_';

export const collectBackupData = (storage: Storage = localStorage): Record<string, string> => {
  const data: Record<string, string> = {};

  for (let i = 0; i < storage.length; i += 1) {
    const key = storage.key(i);
    if (!key || !key.startsWith(XPENSIA_KEY_PREFIX)) continue;

    const value = storage.getItem(key);
    if (value === null) continue;

    data[key] = value;
  }

  return data;
};

export const createBackupPayload = ({
  appVersion,
  platform,
  storage = localStorage,
}: {
  appVersion: string;
  platform: string;
  storage?: Storage;
}): XpensiaBackupFile => ({
  xpensiaBackupVersion: XPENSIA_BACKUP_VERSION,
  createdAt: new Date().toISOString(),
  appVersion,
  platform,
  data: collectBackupData(storage),
});

export const toBackupJson = (backup: XpensiaBackupFile): string => JSON.stringify(backup, null, 2);

export const isLegacyTransactionArrayBackup = (value: unknown): value is Record<string, unknown>[] =>
  Array.isArray(value) && value.length > 0 && value.every((entry) => typeof entry === 'object' && entry !== null);

export const parseBackupPayload = (jsonText: string): XpensiaBackupFile => {
  let parsed: unknown;

  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error('invalid_json');
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('invalid_structure');
  }

  const record = parsed as Partial<XpensiaBackupFile>;
  if (record.xpensiaBackupVersion !== XPENSIA_BACKUP_VERSION) {
    throw new Error('unsupported_backup_version');
  }

  if (typeof record.createdAt !== 'string' || Number.isNaN(Date.parse(record.createdAt))) {
    throw new Error('invalid_created_at');
  }

  if (typeof record.appVersion !== 'string' || !record.appVersion.trim()) {
    throw new Error('invalid_app_version');
  }

  if (typeof record.platform !== 'string' || !record.platform.trim()) {
    throw new Error('invalid_platform');
  }

  if (!record.data || typeof record.data !== 'object' || Array.isArray(record.data)) {
    throw new Error('invalid_data_shape');
  }

  const entries = Object.entries(record.data);
  if (entries.length === 0) {
    throw new Error('empty_backup_data');
  }

  for (const [key, value] of entries) {
    if (typeof key !== 'string' || !key.startsWith(XPENSIA_KEY_PREFIX)) {
      throw new Error('invalid_data_keys');
    }

    if (typeof value !== 'string') {
      throw new Error('invalid_data_values');
    }
  }

  return record as XpensiaBackupFile;
};

export const restoreBackupData = (backup: XpensiaBackupFile, storage: Storage = localStorage): number => {
  const entries = Object.entries(backup.data);
  for (const [key, value] of entries) {
    storage.setItem(key, value);
  }

  return entries.length;
};
