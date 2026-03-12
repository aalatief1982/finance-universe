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
import { useLanguage } from '@/i18n/LanguageContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import SmartPaste from '@/components/SmartPaste';
import { useToast } from '@/hooks/use-toast';
import { Transaction } from '@/types/transaction';
import { createInferenceDTOFromDetection } from '@/lib/inference/createInferenceDTOFromDetection';
import { isAdminMode } from '@/utils/admin-utils';
import { clearPendingSharedText, readPendingSharedText } from '@/lib/share-target/pendingSharedText';


interface ImportTransactionsLocationState {
  senderHint?: string;
  sender?: string;
  voiceTranscript?: string;
}

const ImportTransactions = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { t } = useLanguage();
  const locationState = (location.state as ImportTransactionsLocationState | null) || null;
  const [pendingSharedText, setPendingSharedText] = React.useState<string | null>(null);

  const effectiveSenderHint =
    locationState?.senderHint ||
    locationState?.sender ||
    new URLSearchParams(location.search).get('senderHint') ||
    new URLSearchParams(location.search).get('sender') ||
    undefined;

  const hydratePendingSharedText = React.useCallback(() => {
    // Voice transcript from Home mic takes priority
    if (locationState?.voiceTranscript?.trim()) {
      console.log('[VOICE_FLOW][IMPORT] voiceTranscript from navigation state', {
        length: locationState.voiceTranscript.length,
      });
      setPendingSharedText(locationState.voiceTranscript);
      return;
    }

    const pending = readPendingSharedText();
    console.log('[SHARE_FLOW][IMPORT] hydratePendingSharedText read', {
      hasPendingText: Boolean(pending?.text),
      textLength: pending?.text?.length ?? 0,
      source: pending?.source ?? null,
      receivedAt: pending?.receivedAt ?? null,
      locationKey: location.key,
    });

    if (pending?.text) {
      setPendingSharedText(pending.text);
    }
  }, [location.key, toast, locationState?.voiceTranscript]);

  React.useEffect(() => {
    hydratePendingSharedText();
  }, [hydratePendingSharedText, location.key]);

  const handleSharedTextConsumed = React.useCallback(() => {
    console.log('[SHARE_FLOW][IMPORT] handleSharedTextConsumed clearing pending payload');
    clearPendingSharedText();
    setPendingSharedText(null);
  }, []);

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

  const handleTransactionsDetected = (
    transactions: Transaction[],
    rawMessage?: string,
    senderHint?: string,
    confidence?: number,
    matchOrigin?: 'template' | 'structure' | 'ml' | 'fallback' | 'freeform',
    parsingStatus?: 'success' | 'partial' | 'failed',
    matchedCount?: number,
    totalTemplates?: number,
    fieldScore?: number,
    keywordScore?: number,
    fieldConfidences?: Record<string, number>,
    debugTrace?: ReturnType<typeof createInferenceDTOFromDetection>['debugTrace']
  ) => {
    const transaction = transactions[0];

    if (!transaction.id?.trim()) {
      if (import.meta.env.MODE === 'development') {
        console.warn('⚠️ Empty or invalid transaction.id:', transaction);
      }
    }

    const dtoBuildStart = performance.now();
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

    if (debugTrace) {
      debugTrace.operational = debugTrace.operational || {};
      debugTrace.operational.stageTimingsMs = debugTrace.operational.stageTimingsMs || {};
      debugTrace.operational.stageTimingsMs.dto_build = Number((performance.now() - dtoBuildStart).toFixed(2));
    }

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
    <Layout withPadding={false} fullWidth>
      <div className="px-1">

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="space-y-[calc(var(--section-gap)/2)]"
        >
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
