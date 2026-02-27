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

import React, { useEffect, useRef, useState } from 'react';
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

import { cn } from '@/lib/utils';
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
  mode?: 'create' | 'edit';
}

const EditTransaction = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { addTransaction, updateTransaction } = useTransactions();
  const { toast } = useToast();
  const { learnFromTransaction } = useLearningEngine();
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);

  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);
  const [allowNextNav, setAllowNextNav] = useState(false);

  const isDirtyRef = useRef(isDirty);
  const savingRef = useRef(saving);
  const showUnsavedDialogRef = useRef(showUnsavedDialog);

  const [matchDetails, setMatchDetails] = useState<{
    entry: LearnedEntry | null;
    confidence: number;
  } | null>(null);

  const state = location.state as EditTransactionState | null;
  const transaction = state?.transaction;
  const rawMessage = state?.rawMessage;
  const senderHint = state?.senderHint;
  const isSuggested = state?.isSuggested;
  const fieldConfidences = state?.fieldConfidences;
  const isSmartEntryCreate = state?.mode === 'create';
  const isNewTransaction = isSmartEntryCreate ? true : !transaction;
  const transactionForForm = React.useMemo(() => {
    if (!transaction) return transaction;
    if (!isNewTransaction) return transaction;
    return { ...transaction, id: '' };
  }, [isNewTransaction, transaction]);


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
      // fullLocationState: location.state
    // });
  }

  const confirmDiscardIfDirty = React.useCallback((action: () => void) => {
    if (allowNextNav) {
      setAllowNextNav(false);
      action();
      return;
    }

    if (isDirty && !saving) {
      setPendingNavigation(() => action);
      setShowUnsavedDialog(true);
      return;
    }

    action();
  }, [allowNextNav, isDirty, saving]);

  const guardedNavigateBack = React.useCallback(() => {
    confirmDiscardIfDirty(() => navigate(-1));
  }, [confirmDiscardIfDirty, navigate]);

  const handleSave = (editedTransaction: Transaction) => {
    setSaving(true);
    try {
      const payload = isNewTransaction
        ? { ...editedTransaction, id: '' }
        : editedTransaction;

      saveTransactionWithLearning(payload, {
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
    const nextNavigation = pendingNavigation;
    setShowUnsavedDialog(false);
    setPendingNavigation(null);
    setAllowNextNav(true);

    if (nextNavigation) {
      nextNavigation();
      return;
    }

    navigate(-1);
  };

  const handleStayOnPage = () => {
    setShowUnsavedDialog(false);
    setPendingNavigation(null);
  };

  useEffect(() => {
    isDirtyRef.current = isDirty;
  }, [isDirty]);

  useEffect(() => {
    savingRef.current = saving;
  }, [saving]);

  useEffect(() => {
    showUnsavedDialogRef.current = showUnsavedDialog;
  }, [showUnsavedDialog]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    const backListenerPromise = CapacitorApp.addListener('backButton', () => {
      if (showUnsavedDialogRef.current) {
        return;
      }

      if (isDirtyRef.current && !savingRef.current) {
        setPendingNavigation(() => () => navigate(-1));
        setShowUnsavedDialog(true);
        return;
      }

      navigate(-1);
    });

    return () => {
      void backListenerPromise.then((listener) => listener.remove());
    };
  }, [navigate]);

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
    <Layout
      showBack
      withPadding={false}
      fullWidth
      onBack={guardedNavigateBack}
      onLogoClick={() => confirmDiscardIfDirty(() => navigate('/'))}
    >
      <LoadingOverlay isOpen={saving} message="Saving..." />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full px-1 space-y-3 dark:bg-black dark:text-white"
      >

        {rawMessage && (
          <div className="bg-muted p-3 rounded-md">
            <p className="text-xs font-mono break-words">
              <span className="font-semibold">Source message:</span> {rawMessage}
            </p>
          </div>
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
                  {matchDetails.entry.confirmedFields.vendor && (
                    <li>Payee: {matchDetails.entry.confirmedFields.vendor}</li>
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
          <CardContent className={cn('pt-[var(--card-padding)]')}>
            <TransactionEditForm
              transaction={transactionForForm}
              onSave={handleSave}
              compact
              showNotes={false}
              fieldConfidences={fieldConfidences}
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
              You have unsaved changes. Discard them?
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
