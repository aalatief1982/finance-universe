import { safeStorage } from '@/utils/safe-storage';

export type TemplateHashFromAccountMapEntry = {
  fromAccount: string;
  count: number;
  updatedAt: number;
};

type TemplateHashFromAccountMap = Record<string, TemplateHashFromAccountMapEntry>;

const TEMPLATEHASH_FROMACCOUNT_MAP_KEY = 'xpensia_templatehash_fromaccount_map_v1';
const UNKNOWN_SENDER_KEY = '__unknown_sender__';

const normalizeSenderKey = (senderHint?: string): string => {
  const normalized = senderHint?.trim().toLocaleLowerCase();
  return normalized || UNKNOWN_SENDER_KEY;
};

const getMapKey = (senderHint: string | undefined, templateHash: string): string =>
  `${normalizeSenderKey(senderHint)}::${templateHash}`;

const loadTemplateHashFromAccountMap = (): TemplateHashFromAccountMap => {
  try {
    return JSON.parse(
      safeStorage.getItem(TEMPLATEHASH_FROMACCOUNT_MAP_KEY) || '{}',
    );
  } catch {
    return {};
  }
};

const saveTemplateHashFromAccountMap = (
  map: TemplateHashFromAccountMap,
): void => {
  safeStorage.setItem(TEMPLATEHASH_FROMACCOUNT_MAP_KEY, JSON.stringify(map));
};

export const getPreferredFromAccount = (
  senderHint: string | undefined,
  templateHash: string | undefined,
): string | null => {
  const normalizedHash = templateHash?.trim();
  if (!normalizedHash) {
    return null;
  }

  const map = loadTemplateHashFromAccountMap();
  const preferred = map[getMapKey(senderHint, normalizedHash)]?.fromAccount;
  if (typeof preferred !== 'string') {
    return null;
  }

  const normalizedFromAccount = preferred.trim();
  return normalizedFromAccount || null;
};

export const recordPreferredFromAccount = (
  senderHint: string | undefined,
  templateHash: string | undefined,
  fromAccount: string | undefined,
): void => {
  const normalizedHash = templateHash?.trim();
  const normalizedFromAccount = fromAccount?.trim();

  if (!normalizedHash || !normalizedFromAccount) {
    return;
  }

  const map = loadTemplateHashFromAccountMap();
  const key = getMapKey(senderHint, normalizedHash);
  const existing = map[key];

  if (!existing) {
    map[key] = {
      fromAccount: normalizedFromAccount,
      count: 1,
      updatedAt: Date.now(),
    };
    saveTemplateHashFromAccountMap(map);
    return;
  }

  if (existing.fromAccount.trim() === normalizedFromAccount) {
    map[key] = {
      ...existing,
      fromAccount: normalizedFromAccount,
      count: existing.count + 1,
      updatedAt: Date.now(),
    };
  } else {
    map[key] = {
      fromAccount: normalizedFromAccount,
      count: 1,
      updatedAt: Date.now(),
    };
  }

  saveTemplateHashFromAccountMap(map);
};
