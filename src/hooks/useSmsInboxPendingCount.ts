import { useSyncExternalStore } from 'react';
import { getPendingInboxCount, subscribeInbox } from '@/lib/sms-inbox/smsInboxQueue';

export const useSmsInboxPendingCount = (): number => {
  return useSyncExternalStore(subscribeInbox, getPendingInboxCount, () => 0);
};
