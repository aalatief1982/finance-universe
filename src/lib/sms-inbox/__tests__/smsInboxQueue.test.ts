import { beforeEach, describe, expect, it } from 'vitest';
import {
  SMS_INBOX_QUEUE_KEY,
  enqueueSms,
  getInbox,
} from '@/lib/sms-inbox/smsInboxQueue';

describe('smsInboxQueue dedupe behavior', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('dedupes exact same sender/body/receivedAt fingerprint even outside rolling window', () => {
    const fixedReceivedAt = '2026-01-15T10:45:30.123Z';

    enqueueSms({
      sender: 'ACME-BANK',
      body: 'Debit alert: USD 50.00 at Store A',
      receivedAt: fixedReceivedAt,
      source: 'listener',
    });

    enqueueSms({
      sender: ' ACME-BANK ',
      body: 'Debit   alert: USD 50.00   at Store A',
      receivedAt: fixedReceivedAt,
      source: 'static_receiver',
    });

    const inbox = getInbox();
    expect(inbox).toHaveLength(1);
    expect(inbox[0].fingerprint).toBeDefined();
  });

  it('keeps legitimately distinct identical messages when timestamp differs meaningfully', () => {
    enqueueSms({
      sender: 'ACME-BANK',
      body: 'Debit alert: USD 50.00 at Store A',
      receivedAt: '2026-01-15T10:45:30.000Z',
      source: 'listener',
    });

    enqueueSms({
      sender: 'ACME-BANK',
      body: 'Debit alert: USD 50.00 at Store A',
      receivedAt: '2026-01-15T12:45:30.000Z',
      source: 'listener',
    });

    const inbox = getInbox();
    expect(inbox).toHaveLength(2);
  });

  it('remains backward-compatible with legacy queue items that have no fingerprint', () => {
    const legacyQueue = [
      {
        id: 'legacy-item',
        sender: 'ACME-BANK',
        body: 'Debit alert: USD 50.00 at Store A',
        receivedAt: '2026-01-15T10:45:30.000Z',
        status: 'new',
        source: 'listener',
      },
    ];

    window.localStorage.setItem(SMS_INBOX_QUEUE_KEY, JSON.stringify(legacyQueue));

    enqueueSms({
      sender: 'ACME-BANK',
      body: 'Debit alert: USD 50.00 at Store A',
      receivedAt: '2026-01-15T10:45:30.000Z',
      source: 'static_receiver',
    });

    expect(getInbox()).toHaveLength(1);
  });
});
