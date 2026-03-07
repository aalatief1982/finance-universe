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
import { useToast } from '@/hooks/use-toast';
import { Transaction } from '@/types/transaction';
import { buildInferenceDTO } from '@/lib/inference/buildInferenceDTO';
import { createInferenceDTOFromDetection } from '@/lib/inference/createInferenceDTOFromDetection';
import { getInbox, markSmsStatus, SmsInboxItem } from '@/lib/sms-inbox/smsInboxQueue';
import { isAdminMode } from '@/utils/admin-utils';
import { clearPendingSharedText, readPendingSharedText } from '@/lib/share-target/pendingSharedText';


interface ImportTransactionsLocationState {
  senderHint?: string;
  sender?: string;
  scrollToInbox?: boolean;
}

const ImportTransactions = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [smsInboxItems, setSmsInboxItems] = React.useState<SmsInboxItem[]>([]);
  const smsInboxRef = React.useRef<HTMLDivElement | null>(null);
  const locationState = (location.state as ImportTransactionsLocationState | null) || null;
  const [pendingSharedText, setPendingSharedText] = React.useState<string | null>(null);

  const effectiveSenderHint =
    locationState?.senderHint ||
    locationState?.sender ||
    new URLSearchParams(location.search).get('senderHint') ||
    new URLSearchParams(location.search).get('sender') ||
    undefined;

  if (import.meta.env.MODE === 'development') {
    // console.log('[ImportTransactions] Page initialized');
  }


  const loadSmsInbox = React.useCallback(() => {
    const items = getInbox()
      .sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());

    setSmsInboxItems(items);
  }, []);

  React.useEffect(() => {
    loadSmsInbox();
  }, [loadSmsInbox]);


  const hydratePendingSharedText = React.useCallback(() => {
    const pending = readPendingSharedText();
    if (pending?.text) {
      setPendingSharedText(pending.text);
    }
  }, []);

  React.useEffect(() => {
    hydratePendingSharedText();
  }, [hydratePendingSharedText, location.key]);

  const handleSharedTextConsumed = React.useCallback(() => {
    clearPendingSharedText();
    setPendingSharedText(null);
  }, []);

  React.useEffect(() => {
    if (!locationState?.scrollToInbox) {
      return;
    }

    smsInboxRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

    navigate(location.pathname + location.search, {
      replace: true,
      state: {
        ...locationState,
        scrollToInbox: false,
      },
    });
  }, [location.pathname, location.search, locationState, navigate]);

  const newItems = React.useMemo(
    () => smsInboxItems.filter((item) => item.status === 'new'),
    [smsInboxItems]
  );

  const openedItems = React.useMemo(
    () => smsInboxItems.filter((item) => item.status === 'opened'),
    [smsInboxItems]
  );

  const DEBUG_INFERENCE_FLOW = import.meta.env.VITE_DEBUG_INFERENCE_FLOW === 'true';
  const adminEnabled = isAdminMode();

  const debugInferencePayload = React.useCallback((flow: 'smart-entry' | 'notification-review', inferenceDTO: ReturnType<typeof createInferenceDTOFromDetection>) => {
    if (!DEBUG_INFERENCE_FLOW) return;

    const tx = inferenceDTO.transaction;
    const raw = inferenceDTO.rawMessage || '';
    const hash = Array.from(raw).reduce((acc, char) => ((acc << 5) - acc + char.charCodeAt(0)) | 0, 0);
    const fields: Array<keyof Transaction> = ['amount', 'date', 'vendor', 'fromAccount', 'toAccount', 'category', 'subcategory', 'type', 'currency'];

    console.log('[InferenceFlowDebug]', {
      flow,
      transactionId: tx.id,
      rawMessageHash: hash,
      rawMessagePreview: raw.slice(0, 80),
      fields: fields.map((field) => ({
        field,
        value: tx[field],
        status: tx[field] ? 'present' : 'empty',
        source: typeof inferenceDTO.fieldConfidences?.[field] === 'number' ? 'fieldConfidences' : (inferenceDTO.matchOrigin || inferenceDTO.origin || 'unknown'),
        confidence: inferenceDTO.fieldConfidences?.[field],
      })),
      matchOrigin: inferenceDTO.matchOrigin,
      origin: inferenceDTO.origin,
      parsingStatus: inferenceDTO.parsingStatus,
    });
  }, [DEBUG_INFERENCE_FLOW]);

  const handleReviewSms = React.useCallback(async (item: SmsInboxItem) => {
    try {
      const inferenceDTO = await buildInferenceDTO({
        rawMessage: item.body,
        senderHint: item.sender,
        source: 'sms',
      });

      debugInferencePayload('notification-review', inferenceDTO);

      markSmsStatus(item.id, 'opened');
      loadSmsInbox();

      const continueState = {
        ...inferenceDTO,
        mode: 'create' as const,
        isSuggested: true,
        smsInboxId: item.id,
      };

      if (adminEnabled) {
        navigate('/engine-out', {
          state: {
            source: 'notification_review',
            inferenceDTO,
            continueState,
          },
        });
      } else {
        navigate('/edit-transaction', {
          state: continueState,
        });
      }
    } catch (error) {
      console.error('[ImportTransactions] Failed to build inference DTO', {
        module: 'pages/ImportTransactions',
        fn: 'handleReviewSms',
        action: 'review',
        itemId: item.id,
        sender: item.sender,
        isBodyEmpty: !item.body?.trim(),
        route: `${location.pathname}${location.search}${location.hash}`,
        error,
      });

      toast({
        title: 'Unable to open SMS',
        description: 'We could not open this SMS right now. Please try again.',
        variant: 'destructive',
      });
    }
  }, [adminEnabled, debugInferencePayload, loadSmsInbox, location.hash, location.pathname, location.search, navigate, toast]);

  const handleContinueSms = React.useCallback(async (item: SmsInboxItem) => {
    try {
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
    } catch (error) {
      console.error('[ImportTransactions] Failed to build inference DTO', {
        module: 'pages/ImportTransactions',
        fn: 'handleContinueSms',
        action: 'continue',
        itemId: item.id,
        sender: item.sender,
        isBodyEmpty: !item.body?.trim(),
        route: `${location.pathname}${location.search}${location.hash}`,
        error,
      });

      toast({
        title: 'Unable to continue SMS',
        description: 'We could not continue this SMS right now. Please try again.',
        variant: 'destructive',
      });
    }
  }, [location.hash, location.pathname, location.search, navigate, toast]);

  const handleIgnoreSms = React.useCallback((id: string) => {
    markSmsStatus(id, 'ignored');
    loadSmsInbox();
  }, [loadSmsInbox]);

  const handleTransactionsDetected = (
    transactions: Transaction[],
    rawMessage?: string,
    senderHint?: string,
    confidence?: number,
    matchOrigin?: 'template' | 'structure' | 'ml' | 'fallback',
    parsingStatus?: 'success' | 'partial' | 'failed',
    matchedCount?: number,
    totalTemplates?: number,
    fieldScore?: number,
    keywordScore?: number,
    fieldConfidences?: Record<string, number>,
    debugTrace?: ReturnType<typeof createInferenceDTOFromDetection>['debugTrace']
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

    const inferenceDTO = createInferenceDTOFromDetection({
      transaction: {
        ...transaction,
        details: { ...transaction.details, rawMessage: rawMessage ?? '' },
      },
      rawMessage,
      senderHint,
      confidence,
      parsingStatus,
      matchedCount,
      totalTemplates,
      fieldScore,
      keywordScore,
      fieldConfidences,
      isSuggested: true,
      origin: matchOrigin,
      matchOrigin,
      mode: 'create',
      debugTrace,
    });

    debugInferencePayload('smart-entry', inferenceDTO);

    if (adminEnabled) {
      navigate('/engine-out', {
        state: {
          source: 'smart_entry',
          inferenceDTO,
          continueState: inferenceDTO,
        },
      });
      return;
    }

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
          <Card ref={smsInboxRef}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">SMS Inbox</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <p className="text-sm font-medium">New SMS</p>
                {newItems.length === 0 ? (
                  <div className="rounded-md border px-3 py-2 text-sm text-muted-foreground">No new SMS</div>
                ) : (
                  newItems.map((item) => (
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
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">In review</p>
                {openedItems.length === 0 ? (
                  <div className="rounded-md border px-3 py-2 text-sm text-muted-foreground">No items in review</div>
                ) : (
                  openedItems.map((item) => (
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
                        <Button onClick={() => void handleContinueSms(item)}>Continue</Button>
                        <Button variant="destructive" onClick={() => handleIgnoreSms(item.id)}>
                          Ignore
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <div className="bg-card p-[var(--card-padding)] rounded-lg shadow">
            <SmartPaste
              senderHint={effectiveSenderHint}
              prefillText={pendingSharedText}
              onPrefillConsumed={handleSharedTextConsumed}
              onTransactionsDetected={handleTransactionsDetected}
            />
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default ImportTransactions;
