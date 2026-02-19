import { safeStorage } from '@/utils/safe-storage';
import { logAnalyticsEvent } from '@/utils/firebase-analytics';
import { getSmsSenderImportMap, setSelectedSmsSenders } from '@/utils/storage-utils';

interface LegacySmsProviderSelection {
  id?: string;
  name?: string;
  isSelected?: boolean;
}

export interface SmsFlowMigrationResult {
  ok: boolean;
  skipped: boolean;
  selectedSenderCount: number;
  removedArtifacts: string[];
  error?: string;
}

const SMS_FLOW_SCHEMA_VERSION_KEY = 'sms_flow_schema_version';
const TARGET_SMS_FLOW_SCHEMA_VERSION = 1;
const LEGACY_PROVIDER_KEYS = ['sms_providers', 'smsProviders', 'xpensia_sms_vendors'] as const;

const getLegacySelectedProviderCandidates = (): string[] => {
  try {
    const raw = safeStorage.getItem('sms_providers');
    if (!raw) return [];

    const parsed = JSON.parse(raw) as LegacySmsProviderSelection[];
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((provider) => provider?.isSelected)
      .flatMap((provider) => [provider.id, provider.name])
      .filter((value): value is string => typeof value === 'string' && value.trim().length > 0);
  } catch {
    return [];
  }
};

const normalizeSchemaVersion = (raw: string | null): number => {
  if (!raw) return 0;
  const parsed = parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const migrateSmsFlowSchema = async (): Promise<SmsFlowMigrationResult> => {
  const currentVersion = normalizeSchemaVersion(safeStorage.getItem(SMS_FLOW_SCHEMA_VERSION_KEY));

  if (currentVersion >= TARGET_SMS_FLOW_SCHEMA_VERSION) {
    return {
      ok: true,
      skipped: true,
      selectedSenderCount: Object.keys(getSmsSenderImportMap()).length,
      removedArtifacts: [],
    };
  }

  try {
    const senderImportMap = getSmsSenderImportMap();
    const checkpointSenders = Object.keys(senderImportMap);
    const legacyCandidates = getLegacySelectedProviderCandidates();

    const selectedSenders = Array.from(new Set([...checkpointSenders, ...legacyCandidates]));
    if (selectedSenders.length > 0) {
      setSelectedSmsSenders(selectedSenders);
    }

    const removedArtifacts: string[] = [];
    LEGACY_PROVIDER_KEYS.forEach((key) => {
      if (safeStorage.getItem(key) !== null) {
        safeStorage.removeItem(key);
        removedArtifacts.push(key);
      }
    });

    safeStorage.setItem(SMS_FLOW_SCHEMA_VERSION_KEY, String(TARGET_SMS_FLOW_SCHEMA_VERSION));

    await logAnalyticsEvent('sms_flow_migration_v1_success', {
      selectedSenderCount: selectedSenders.length,
      checkpointCount: checkpointSenders.length,
      removedArtifacts: removedArtifacts.join(','),
    });

    return {
      ok: true,
      skipped: false,
      selectedSenderCount: selectedSenders.length,
      removedArtifacts,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown_error';

    await logAnalyticsEvent('sms_flow_migration_v1_failed', {
      error: message,
    });

    return {
      ok: false,
      skipped: false,
      selectedSenderCount: 0,
      removedArtifacts: [],
      error: message,
    };
  }
};
