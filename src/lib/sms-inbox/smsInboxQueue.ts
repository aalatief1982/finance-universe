const SMS_INBOX_QUEUE_KEY = 'xpensia_sms_inbox_queue';
const MAX_INBOX_ITEMS = 200;
const DEDUP_WINDOW_MS = 10 * 60 * 1000;

type SmsInboxStatus = 'new' | 'opened' | 'processed' | 'ignored';
type SmsInboxSource = 'listener';

export interface SmsInboxItem {
  id: string;
  sender: string;
  body: string;
  receivedAt: string;
  status: SmsInboxStatus;
  source: SmsInboxSource;
}

interface EnqueueSmsInput {
  sender: string;
  body: string;
  receivedAt?: string;
  source?: SmsInboxSource;
}

interface GetInboxCountOptions {
  status?: SmsInboxStatus;
}

interface ClearInboxOptions {
  status?: SmsInboxStatus;
}

const normalize = (value: string): string => value.trim().replace(/\s+/g, ' ').toLowerCase();

const buildDedupKey = (sender: string, body: string): string => `${normalize(sender)}|${normalize(body)}`;

const getSafeStorage = (): Storage | null => {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return null;
  }

  return window.localStorage;
};

const generateId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const parseInbox = (rawValue: string | null): SmsInboxItem[] => {
  if (!rawValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawValue);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((item): item is SmsInboxItem => {
      return !!item
        && typeof item.id === 'string'
        && typeof item.sender === 'string'
        && typeof item.body === 'string'
        && typeof item.receivedAt === 'string'
        && (item.status === 'new' || item.status === 'opened' || item.status === 'processed' || item.status === 'ignored')
        && item.source === 'listener';
    });
  } catch {
    return [];
  }
};

const loadInbox = (): SmsInboxItem[] => {
  const storage = getSafeStorage();
  if (!storage) {
    return [];
  }

  return parseInbox(storage.getItem(SMS_INBOX_QUEUE_KEY));
};

const saveInbox = (items: SmsInboxItem[]): void => {
  const storage = getSafeStorage();
  if (!storage) {
    return;
  }

  storage.setItem(SMS_INBOX_QUEUE_KEY, JSON.stringify(items));
};

export const enqueueSms = ({ sender, body, receivedAt, source = 'listener' }: EnqueueSmsInput): SmsInboxItem[] => {
  const nextReceivedAt = receivedAt ?? new Date().toISOString();
  const nextReceivedAtMs = new Date(nextReceivedAt).getTime();

  const inbox = loadInbox();
  const dedupKey = buildDedupKey(sender, body);

  const isDuplicate = inbox.some((item) => {
    const existingMs = new Date(item.receivedAt).getTime();
    if (!Number.isFinite(existingMs) || !Number.isFinite(nextReceivedAtMs)) {
      return false;
    }

    return buildDedupKey(item.sender, item.body) === dedupKey
      && Math.abs(nextReceivedAtMs - existingMs) <= DEDUP_WINDOW_MS;
  });

  if (isDuplicate) {
    return inbox;
  }

  const nextInbox = [
    ...inbox,
    {
      id: generateId(),
      sender,
      body,
      receivedAt: nextReceivedAt,
      status: 'new' as const,
      source,
    },
  ];

  const trimmedInbox = nextInbox.length > MAX_INBOX_ITEMS
    ? nextInbox.slice(nextInbox.length - MAX_INBOX_ITEMS)
    : nextInbox;

  saveInbox(trimmedInbox);
  return trimmedInbox;
};

export const getInbox = (): SmsInboxItem[] => loadInbox();

export const getInboxCount = ({ status }: GetInboxCountOptions = {}): number => {
  const inbox = loadInbox();
  if (!status) {
    return inbox.length;
  }

  return inbox.filter((item) => item.status === status).length;
};

export const markSmsStatus = (id: string, status: SmsInboxStatus): SmsInboxItem[] => {
  const inbox = loadInbox();
  const nextInbox = inbox.map((item) => (item.id === id ? { ...item, status } : item));
  saveInbox(nextInbox);
  return nextInbox;
};

export const clearInbox = (options: ClearInboxOptions = {}): SmsInboxItem[] => {
  const inbox = loadInbox();
  if (!options.status) {
    saveInbox([]);
    return [];
  }

  const nextInbox = inbox.filter((item) => item.status !== options.status);
  saveInbox(nextInbox);
  return nextInbox;
};

export {
  SMS_INBOX_QUEUE_KEY,
  MAX_INBOX_ITEMS,
  DEDUP_WINDOW_MS,
};
