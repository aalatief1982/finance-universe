import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import { Transaction } from '@/types/transaction';
import { useTransactions } from '@/context/TransactionContext';
import { useToast } from '@/components/ui/use-toast';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import TransactionEditForm from '@/components/TransactionEditForm';
import { useLearningEngine } from '@/hooks/useLearningEngine';
import { Alert, AlertDescription } from '@/components/ui/alert';
import SmartPasteSummary from '@/components/SmartPasteSummary';
import { LearnedEntry } from '@/types/learning';
import { saveTransactionWithLearning } from '@/lib/smart-paste-engine/saveTransactionWithLearning';

const EditTransaction = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
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
    });
  };

  return (
    <Layout showBack>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full py-4 sm:py-[var(--page-padding-y)] space-y-4 sm:space-y-6 px-[var(--page-padding-x)] sm:px-[var(--page-padding-x)]"
      >
        <h1 className="text-xl sm:text-2xl font-bold">
          {isNewTransaction ? 'Add Transaction' : 'Edit Transaction'}
        </h1>

        {isSuggested && (
          <Alert>
            <AlertDescription className="text-sm">
              This transaction was automatically suggested based on previous patterns.
              You can edit any field before saving.
            </AlertDescription>
          </Alert>
        )}

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
            />
          )}

        {matchDetails?.confidence === 0.4 && (
          <Alert className="bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-300 border-purple-300">
            <AlertDescription className="text-sm">
              This transaction was matched using a saved <strong>template structure</strong> with partial confidence (40%).<br />
              You can review and adjust the fields before saving to improve future detection.
            </AlertDescription>
          </Alert>
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
          <CardHeader className="pb-2">
            <CardTitle>
              {isNewTransaction ? 'Create a new transaction' : 'Edit transaction details'}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <TransactionEditForm transaction={transaction} onSave={handleSave} />
          </CardContent>
        </Card>
      </motion.div>
    </Layout>
  );
};

export default EditTransaction;
