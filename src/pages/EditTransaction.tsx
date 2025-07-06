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
import { FirebaseAnalytics } from '@capacitor-firebase/analytics';

const EditTransaction = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { addTransaction, updateTransaction } = useTransactions();
  const { toast } = useToast();
  const { learnFromTransaction } = useLearningEngine();

  const [matchDetails, setMatchDetails] = useState<{
    entry: LearnedEntry | null;
    confidence: number;
  } | null>(null);

  const transaction = location.state?.transaction as Transaction | undefined;
  const rawMessage = location.state?.rawMessage as string | undefined;
  const senderHint = location.state?.senderHint as string | undefined;
  const isSuggested = location.state?.isSuggested as boolean | undefined;
  const confidenceScore = location.state?.confidence as number | undefined;
  const fieldConfidences = location.state?.fieldConfidences as
    | Record<string, number>
    | undefined;
  const isNewTransaction = !transaction;

  const handleSave = (editedTransaction: Transaction) => {
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
    FirebaseAnalytics.logEvent({ name: 'edit_transaction' });
  };

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

        {confidenceScore !== undefined &&
          location.state?.matchedCount !== undefined &&
          location.state?.totalTemplates !== undefined && (
            <SmartPasteSummary
              confidence={confidenceScore}
              matchedCount={location.state.matchedCount}
              totalTemplates={location.state.totalTemplates}
              fieldScore={location.state.fieldScore}
              keywordScore={location.state.keywordScore}
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
            />
          </CardContent>
        </Card>
      </motion.div>
    </Layout>
  );
};

export default EditTransaction;
