/**
 * @file EditTransaction.tsx
 * @description Page component for EditTransaction.
 *
 * @module pages/EditTransaction
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

import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import { Transaction } from '@/types/transaction';
import { useTransactions } from '@/context/TransactionContext';
import { useToast } from '@/components/ui/use-toast';
import {
  Card,
  CardContent
} from '@/components/ui/card';
import TransactionEditForm from '@/components/TransactionEditForm';
import { useLearningEngine } from '@/hooks/useLearningEngine';

import SmartPasteSummary from '@/components/SmartPasteSummary';
import { LearnedEntry } from '@/types/learning';
import { saveTransactionWithLearning } from '@/lib/smart-paste-engine/saveTransactionWithLearning';
import { logAnalyticsEvent } from '@/utils/firebase-analytics';
import { LoadingOverlay } from '@/components/ui/loading-overlay';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

interface EditTransactionState {
  transaction?: Transaction;
  rawMessage?: string;
  senderHint?: string;
  isSuggested?: boolean;
  confidence?: number;
  fieldConfidences?: Record<string, number>;
  matchedCount?: number;
  totalTemplates?: number;
  fieldScore?: number;
  keywordScore?: number;
}

const EditTransaction = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { addTransaction, updateTransaction } = useTransactions();
  const { toast } = useToast();
  const { learnFromTransaction } = useLearningEngine();
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);

  const [matchDetails, setMatchDetails] = useState<{
    entry: LearnedEntry | null;
    confidence: number;
  } | null>(null);

  const state = location.state as EditTransactionState | null;
  const transaction = state?.transaction;
  const rawMessage = state?.rawMessage;
  const senderHint = state?.senderHint;
  const isSuggested = state?.isSuggested;
  const confidenceScore = state?.confidence;
  const fieldConfidences = state?.fieldConfidences;
  const isNewTransaction = !transaction;

  const isHandlingDiscardRef = React.useRef(false);

  if (import.meta.env.MODE === 'development') {
    // console.log('[EditTransaction] Component initialized with state:', {
      // transaction,
      // fieldConfidences,
      // fieldConfidencesKeys: fieldConfidences ? Object.keys(fieldConfidences) : [],
      // fieldConfidencesValues: fieldConfidences ? Object.values(fieldConfidences) : [],
      // fieldConfidencesStringified: JSON.stringify(fieldConfidences),
      // rawMessage: rawMessage?.substring(0, 100),
      // senderHint,
      // isSuggested,
      // confidenceScore,
      // fullLocationState: location.state
    // });
  }

  const requestNavigation = React.useCallback((action: () => void) => {
    if (isDirty && !saving) {
      setPendingNavigation(() => action);
      setShowUnsavedDialog(true);
      return;
    }

    action();
  }, [isDirty, saving]);

  const handleSave = (editedTransaction: Transaction) => {
    setSaving(true);
    try {
      saveTransactionWithLearning(editedTransaction, {
        rawMessage,
        isNew: isNewTransaction,
        senderHint,
        addTransaction,
        updateTransaction,
        learnFromTransaction,
        navigateBack: () => navigate(-1),
        combineToasts: true,
      });
      logAnalyticsEvent('edit_transaction');
      setIsDirty(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDiscardChanges = () => {
    setShowUnsavedDialog(false);
    setIsDirty(false);
    const action = pendingNavigation;
    setPendingNavigation(null);
    isHandlingDiscardRef.current = true;
    action?.();
    window.setTimeout(() => {
      isHandlingDiscardRef.current = false;
    }, 0);
  };

  const handleStayOnPage = () => {
    setShowUnsavedDialog(false);
    setPendingNavigation(null);
  };

  useEffect(() => {
    if (!isDirty || saving) {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty, saving]);

  useEffect(() => {
    const handleDocumentNavigationAttempt = (event: MouseEvent) => {
      if (!isDirty || saving) {
        return;
      }

      const target = event.target as HTMLElement | null;
      const anchor = target?.closest('a[href]') as HTMLAnchorElement | null;
      if (!anchor) {
        return;
      }

      if (
        anchor.target === '_blank' ||
        anchor.hasAttribute('download') ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) {
        return;
      }

      const nextPath = `${url.pathname}${url.search}${url.hash}`;
      const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      if (nextPath === currentPath) {
        return;
      }

      event.preventDefault();
      requestNavigation(() => navigate(nextPath));
    };

    document.addEventListener('click', handleDocumentNavigationAttempt, true);
    return () => {
      document.removeEventListener('click', handleDocumentNavigationAttempt, true);
    };
  }, [isDirty, navigate, requestNavigation, saving]);

  useEffect(() => {
    if (!isDirty || saving) {
      return;
    }

    const popMarker = { editTransactionGuard: true };
    window.history.pushState(popMarker, '', window.location.href);

    const handlePopState = () => {
      if (isHandlingDiscardRef.current || !isDirty || saving) {
        return;
      }

      window.history.pushState(popMarker, '', window.location.href);
      requestNavigation(() => navigate(-1));
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isDirty, navigate, requestNavigation, saving]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    let isMounted = true;
    const setupBackHandler = async () => {
      const backListener = await CapacitorApp.addListener('backButton', () => {
        if (!isMounted || showUnsavedDialog) {
          return;
        }

        if (isDirty && !saving) {
          requestNavigation(() => navigate(-1));
          return;
        }

        navigate(-1);
      });

      if (!isMounted) {
        backListener.remove();
        return;
      }

      return () => {
        backListener.remove();
      };
    };

    let teardown: (() => void) | undefined;
    setupBackHandler().then((cleanup) => {
      teardown = cleanup;
    });

    return () => {
      isMounted = false;
      teardown?.();
    };
  }, [isDirty, navigate, requestNavigation, saving, showUnsavedDialog]);

  useEffect(() => {
    if (isSuggested) {
      toast({
        title: "Suggested transaction",
        description:
          "This transaction was automatically suggested based on previous patterns. You can edit any field before saving.",
      });
    }

    if (matchDetails?.confidence === 0.4) {
      toast({
        title: "Low confidence match",
        description:
          "This transaction was matched using a saved template structure with partial confidence (40%). You can review and adjust the fields before saving to improve future detection.",
      });
    }
  }, [isSuggested, matchDetails, toast]);

  return (
    <Layout showBack withPadding={false} fullWidth>
      <LoadingOverlay isOpen={saving} message="Saving..." />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full px-1 space-y-4 dark:bg-black dark:text-white min-h-screen"
      >

        {rawMessage && (
          <div className="bg-muted p-3 rounded-md">
            <p className="text-xs font-mono break-words">
              <span className="font-semibold">Source message:</span> {rawMessage}
            </p>
          </div>
        )}

        {!isEditing && confidenceScore !== undefined &&
          state?.matchedCount !== undefined &&
          state?.totalTemplates !== undefined && (
            <SmartPasteSummary
              confidence={confidenceScore}
              matchedCount={state.matchedCount}
              totalTemplates={state.totalTemplates}
              fieldScore={state.fieldScore}
              keywordScore={state.keywordScore}
            />
          )}

        {matchDetails?.entry && (
          <div className="border border-red-300 bg-red-50 dark:bg-red-950/20 p-4 rounded-md">
            <h3 className="text-red-600 dark:text-red-400 font-medium mb-2">Smart Matching Details</h3>
            <div className="text-sm text-red-600 dark:text-red-400 space-y-2">
              <p><strong>Match Confidence:</strong> {Math.round(matchDetails.confidence * 100)}%</p>
              <p><strong>Matched Template:</strong> {matchDetails.entry.rawMessage.substring(0, 50)}...</p>
              <div>
                <p className="font-semibold mb-1">Matched Fields:</p>
                <ul className="list-disc list-inside pl-2 space-y-1">
                  <li>Transaction Type: {matchDetails.entry.confirmedFields.type}</li>
                  <li>Amount: {matchDetails.entry.confirmedFields.amount} {matchDetails.entry.confirmedFields.currency}</li>
                  <li>Category: {matchDetails.entry.confirmedFields.category}</li>
                  <li>Account: {matchDetails.entry.confirmedFields.account}</li>
                  {matchDetails.entry.confirmedFields.person && (
                    <li>Person: {matchDetails.entry.confirmedFields.person}</li>
                  )}
                  {matchDetails.entry.confirmedFields.vendor && (
                    <li>Vendor: {matchDetails.entry.confirmedFields.vendor}</li>
                  )}
                </ul>
              </div>
              <p className="italic text-xs mt-2">
                The transaction details were auto-filled based on this previously learned pattern.
                You can still edit any field before saving.
              </p>
            </div>
          </div>
        )}

        <Card className="w-full">
          <CardContent className="pt-[var(--card-padding)]">
            <TransactionEditForm
              transaction={transaction}
              onSave={handleSave}
              compact
              showNotes={false}
              fieldConfidences={fieldConfidences}
              onEditStart={() => setIsEditing(true)}
              onDirtyChange={setIsDirty}
            />
          </CardContent>
        </Card>
      </motion.div>

      <AlertDialog
        open={showUnsavedDialog}
        onOpenChange={(open) => {
          if (!open) {
            handleStayOnPage();
            return;
          }
          setShowUnsavedDialog(true);
        }}
      >
        <AlertDialogContent className="w-[calc(100%-2rem)] max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Do you want to stay and keep editing, or discard your changes?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleStayOnPage}>Stay</AlertDialogCancel>
            <AlertDialogAction onClick={handleDiscardChanges}>Discard</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default EditTransaction;
