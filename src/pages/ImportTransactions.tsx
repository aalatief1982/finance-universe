/**
 * @file ImportTransactions.tsx
 * @description Page component for ImportTransactions.
 *
 * @module pages/ImportTransactions
 *
 * @responsibilities
 * 1. Compose layout and section components
 * 2. Load data or invoke services for the page
 * 3. Handle navigation and page-level actions
 *
 * @review-tags
 * - @ui: page composition
 *
 * @review-checklist
 * - [ ] Data loading handles empty states
 * - [ ] Navigation hooks are wired correctly
 */

import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import SmartPaste from '@/components/SmartPaste';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Transaction } from '@/types/transaction';
import { buildInferenceDTO } from '@/lib/inference/buildInferenceDTO';
import { normalizeInferenceDTO } from '@/lib/inference/inferenceDTO';
import { getInbox, markSmsStatus, SmsInboxItem } from '@/lib/sms-inbox/smsInboxQueue';


interface ImportTransactionsLocationState {
  senderHint?: string;
  sender?: string;
}

const ImportTransactions = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [smsInboxItems, setSmsInboxItems] = React.useState<SmsInboxItem[]>([]);
  const locationState = (location.state as ImportTransactionsLocationState | null) || null;

  const effectiveSenderHint =
    locationState?.senderHint ||
    locationState?.sender ||
    new URLSearchParams(location.search).get('senderHint') ||
    new URLSearchParams(location.search).get('sender') ||
    undefined;

  if (import.meta.env.MODE === 'development') {
    // console.log('[ImportTransactions] Page initialized');
  }


  const loadNewSmsInbox = React.useCallback(() => {
    const items = getInbox()
      .filter((item) => item.status === 'new')
      .sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());

    setSmsInboxItems(items);
  }, []);

  React.useEffect(() => {
    loadNewSmsInbox();
  }, [loadNewSmsInbox]);

  const handleReviewSms = React.useCallback(async (item: SmsInboxItem) => {
    const inferenceDTO = await buildInferenceDTO({
      rawMessage: item.body,
      senderHint: item.sender,
      source: 'sms',
    });

    navigate('/edit-transaction', {
      state: {
        ...inferenceDTO,
        mode: 'create',
        isSuggested: true,
        smsInboxId: item.id,
      },
    });

    markSmsStatus(item.id, 'opened');
    loadNewSmsInbox();
  }, [loadNewSmsInbox, navigate]);

  const handleIgnoreSms = React.useCallback((id: string) => {
    markSmsStatus(id, 'ignored');
    loadNewSmsInbox();
  }, [loadNewSmsInbox]);

  const handleTransactionsDetected = (
    transactions: Transaction[],
    rawMessage?: string,
    senderHint?: string,
    confidence?: number,
    matchOrigin?: 'template' | 'structure' | 'ml' | 'fallback',
    matchedCount?: number,
    totalTemplates?: number,
    fieldScore?: number,
    keywordScore?: number,
    fieldConfidences?: Record<string, number>
  ) => {
    // if (import.meta.env.MODE === 'development') console.log('[ImportTransactions] onTransactionsDetected called with:', {
      // count: transactions.length,
      // transaction: transactions[0],
      // rawMessageLength: rawMessage?.length,
      // senderHint,
      // confidence,
      // matchOrigin,
      // fieldConfidences,
      // fieldConfidencesKeys: fieldConfidences ? Object.keys(fieldConfidences) : [],
      // fieldConfidencesValues: fieldConfidences ? Object.values(fieldConfidences) : []
    // });

    const transaction = transactions[0];

    if (!transaction.id?.trim()) {
      if (import.meta.env.MODE === 'development') {
        console.warn('⚠️ Empty or invalid transaction.id:', transaction);
      }
    }

    // if (import.meta.env.MODE === 'development') console.log('[ImportTransactions] Navigate to edit with parameters:', {
      // matchOrigin,
      // transaction,
      // fieldConfidences,
      // fieldConfidencesStringified: JSON.stringify(fieldConfidences),
      // navigationState: {
        // transaction: {
          // ...transaction,
          // rawMessage: rawMessage ?? '',
        // },
        // rawMessage,
        // senderHint,
        // confidence,
        // matchedCount,
        // totalTemplates,
        // fieldScore,
        // keywordScore,
        // fieldConfidences,
        // isSuggested: true,
        // matchOrigin,
      // }
    // });

    const inferenceDTO = normalizeInferenceDTO({
      transaction: {
        ...transaction,
        rawMessage: rawMessage ?? '',
      },
      rawMessage,
      senderHint,
      confidence,
      matchedCount,
      totalTemplates,
      fieldScore,
      keywordScore,
      fieldConfidences,
      isSuggested: true,
      origin: matchOrigin,
      matchOrigin,
      mode: 'create',
    });

    navigate('/edit-transaction', {
      state: inferenceDTO,
    });
  };

  return (
    <Layout withPadding={false} fullWidth showBack>
      <div className="px-1">

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="space-y-[calc(var(--section-gap)/2)]"
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">SMS Inbox</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {smsInboxItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">No new SMS to review.</p>
              ) : (
                smsInboxItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-3 rounded-md border p-3 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="min-w-0 space-y-1">
                      <p className="font-semibold">{item.sender}</p>
                      <p className="truncate text-sm text-muted-foreground">{item.body}</p>
                      <p className="text-xs text-muted-foreground">{item.receivedAt.slice(0, 16)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button onClick={() => void handleReviewSms(item)}>Review</Button>
                      <Button variant="destructive" onClick={() => handleIgnoreSms(item.id)}>
                        Ignore
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <div className="bg-card p-[var(--card-padding)] rounded-lg shadow">
            <SmartPaste
              senderHint={effectiveSenderHint}
              onTransactionsDetected={handleTransactionsDetected}
            />
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default ImportTransactions;
