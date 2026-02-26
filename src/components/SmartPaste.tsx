/**
 * @file SmartPaste.tsx
 * @description UI component for SmartPaste.
 *
 * @module components/SmartPaste
 *
 * @responsibilities
 * 1. Render UI for the feature area
 * 2. Accept props and emit user interactions
 * 3. Compose shared subcomponents where needed
 *
 * @review-tags
 * - @ui: visual/layout behavior
 *
 * @review-checklist
 * - [ ] Props have sensible defaults
 * - [ ] Component renders without crashing
 */
import React, { useState, useEffect } from 'react';
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Transaction } from '@/types/transaction';
import { Loader2 } from 'lucide-react';
import { Label } from './ui/label';
import { Card } from './ui/card';
import DetectedTransactionCard from './smart-paste/DetectedTransactionCard';
import NoTransactionMessage from './smart-paste/NoTransactionMessage';
import { parseSmsMessage } from '@/lib/smart-paste-engine/structureParser';
import { parseAndInferTransaction } from '@/lib/smart-paste-engine/parseAndInferTransaction';
import { getTemplateFailureCount } from '@/lib/smart-paste-engine/templateUtils';
import { useNavigate } from 'react-router-dom';
import { isFinancialTransactionMessage } from '@/lib/smart-paste-engine/messageFilter';
import { logAnalyticsEvent } from '@/utils/firebase-analytics';

interface SmartPasteProps {
  senderHint?: string;
  onTransactionsDetected?: (
    transactions: Transaction[],
    rawMessage?: string,
    senderHint?: string,
    confidence?: number,
    matchOrigin?: "template" | "structure" | "ml" | "fallback",
    matchedCount?: number,
    totalTemplates?: number,
    fieldScore?: number,
    keywordScore?: number,
    fieldConfidences?: Record<string, number>
  ) => void;
}

const SmartPaste = ({ senderHint, onTransactionsDetected }: SmartPasteProps) => {
  const [text, setText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detectedTransactions, setDetectedTransactions] = useState<Transaction[]>([]);
  const [matchStatus, setMatchStatus] = useState('Paste a message to begin');
  const [hasMatch, setHasMatch] = useState(false);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [matchOrigin, setMatchOrigin] = useState<'template' | 'structure' | 'ml' | 'fallback' | null>(null);
  const [fieldConfidences, setFieldConfidences] = useState<Record<string, number>>({});
  const [matchedCount, setMatchedCount] = useState<number | null>(null);
  const [totalTemplates, setTotalTemplates] = useState<number | null>(null);
  const [fieldScore, setFieldScore] = useState<number | null>(null);
  const [keywordScore, setKeywordScore] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!text.trim()) {
      setMatchStatus('Paste a message to begin');
      setHasMatch(false);
      setIsSubmitted(false);
      return;
    }

    try {
      const parsed = parseSmsMessage(text, senderHint);
      if (parsed.matched) {
        const bank =
          parsed.inferredFields.vendor?.value ||
          parsed.directFields.vendor?.value ||
          parsed.directFields.fromAccount?.value ||
          '';
        setMatchStatus(
          `Matched template from ${bank || 'saved template'}`
        );
        setHasMatch(true);
      } else {
        setMatchStatus('No saved pattern found yet. We can still extract details from this message.');
        setHasMatch(false);
      }
    } catch {
      setMatchStatus('No saved pattern found yet. We can still extract details from this message.');
      setHasMatch(false);
    }
  }, [text, senderHint]);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!text.trim()) {
    toast({
      title: "Error",
      description: "Please paste or enter a message first",
      variant: "destructive",
    });
    return;
  }
 if (import.meta.env.MODE === 'development') {
   // console.log('[SmartPaste] Checking message:', text);
 }
  // 🚫 Check if message contains financial transaction pattern
  if (!isFinancialTransactionMessage(text)) {
    toast({
      title: "Non-transactional message",
      description: "This message does not appear to contain any transaction data.",
      variant: "default",
    });
    return;
  }

  if (import.meta.env.MODE === 'development') {
    // console.log("[SmartPaste] Submitting message:", text);
  }
  setIsProcessing(true);
  setIsSubmitted(true);
  setError(null);
  setConfidence(null);
  setMatchOrigin(null);
  setMatchedCount(null);
  setTotalTemplates(null);
  setFieldScore(null);
  setKeywordScore(null);
  logAnalyticsEvent('smart_paste_sms');

  try {
    const {
      transaction,
      confidence,
      origin,
      parsed,
      fieldConfidences,
      parsingStatus,
      matchedCount,
      totalTemplates,
      fieldScore,
      keywordScore
    } = await parseAndInferTransaction(text, senderHint);

    if (import.meta.env.MODE === 'development') {
      // console.log("[SmartPaste] Parsed result:", parsed);
    }
    if (import.meta.env.MODE === 'development') {
      // console.log("[SmartPaste] Confidence Breakdown:", {
        // confidence,
        // origin,
        // fieldConfidences
      // });
    }

    setDetectedTransactions([transaction]);
    setConfidence(confidence);
    setMatchOrigin(origin);
    setFieldConfidences(fieldConfidences || {});
    setMatchedCount(matchedCount);
    setTotalTemplates(totalTemplates);
    setFieldScore(fieldScore);
    setKeywordScore(keywordScore);
    
    if (import.meta.env.MODE === 'development') {
      // console.log("[SmartPaste] State updated with fieldConfidences:", fieldConfidences || {});
    }

    if (parsed.matched) {
      const failCount = getTemplateFailureCount(parsed.templateHash, senderHint);
      if (failCount >= 3) {
        toast({
          title: 'Parsing failed repeatedly — help us improve this template',
        });
        navigate(
          `/train-model?msg=${encodeURIComponent(text)}&sender=${encodeURIComponent(
            senderHint || ''
          )}`
        );
      }
    }
  } catch (err: unknown) {
    if (import.meta.env.MODE === 'development') {
      console.error("[SmartPaste] Error in structure parsing:", err);
    }
    setError("Could not parse the message. Try again or report.");
    toast({
      title: "Error",
      description: "Could not parse the message. Try again or report.",
      variant: "destructive",
    });
    setConfidence(null);
    setMatchOrigin(null);
    setMatchedCount(null);
    setTotalTemplates(null);
    setFieldScore(null);
    setKeywordScore(null);
  } finally {
    setIsProcessing(false);
  }
};

  const extractedFieldCount = detectedTransactions[0]
    ? ['amount', 'date', 'vendor', 'category']
        .filter((key) => {
          const value = detectedTransactions[0][key as keyof Transaction];
          if (typeof value === 'number') return value > 0;
          return Boolean(value && String(value).trim() && value !== 'Uncategorized');
        })
        .length
    : 0;

  const handlePaste = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      if (import.meta.env.MODE === 'development') {
        // console.log("[SmartPaste] Clipboard text captured:", clipboardText);
      }
      setText(clipboardText);
    } catch (err) {
      toast({
        title: "Clipboard Error",
        description: "Could not access clipboard.",
        variant: "destructive",
      });
    }
  };

  const handleAddTransaction = (transaction: Transaction) => {
    if (import.meta.env.MODE === 'development') {
      // console.log('[SmartPaste] handleAddTransaction called with:', {
        // transaction,
        // currentFieldConfidences: fieldConfidences,
        // currentConfidence: confidence,
        // currentMatchOrigin: matchOrigin,
        // parsedFields: {
          // amount: transaction.amount,
          // currency: transaction.currency,
          // date: transaction.date,
          // type: transaction.type,
          // category: transaction.category,
          // vendor: transaction.vendor,
          // fromAccount: transaction.fromAccount,
        // }
      // });
    }
    
    if (import.meta.env.MODE === 'development') {
      // console.log("[SmartPaste] Transaction added:", transaction);
    }
    if (onTransactionsDetected) {
      if (import.meta.env.MODE === 'development') {
        // console.log("[SmartPaste] Calling onTransactionsDetected with fieldConfidences:", fieldConfidences);
      }
      onTransactionsDetected(
        [transaction],
        text,
        senderHint,
        confidence || 0.95,
        matchOrigin || 'structure',
        matchedCount || 0,
        totalTemplates || 0,
        fieldScore ?? undefined,
        keywordScore ?? undefined,
        fieldConfidences
      );
    }

    logAnalyticsEvent('smart_paste_save');

    toast({
      title: "Transaction added",
      description: `Added ${transaction.title || transaction.vendor} (${transaction.amount})`,
    });
  };

  return (
    <div className="pt-4 space-y-4">

      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Add a transaction by typing it, pasting an SMS, or using smart input methods.
        </p>
        <div className="grid gap-2">
          <Label htmlFor="message">Transaction details</Label>
          <Textarea
            id="message"
            placeholder="Type or paste transaction details here…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[100px]"
            dir="auto"
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:justify-start gap-2">
          <Button type="submit" disabled={isProcessing || !text.trim()}>
            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Review Transaction
          </Button>
        </div>

        {confidence !== null && (
          <p
            className={`text-sm mt-2 ${
              confidence >= 0.8
                ? 'text-success'
                : confidence >= 0.5
                ? 'text-warning'
                : 'text-destructive'
            }`}
          >
            How sure we are: {(confidence * 100).toFixed(0)}% ·{' '}
            {matchOrigin === 'template'
              ? 'Based on a saved pattern.'
              : matchOrigin === 'ml'
              ? 'Estimated from message text.'
              : matchOrigin === 'fallback'
              ? 'Best effort guess from message text.'
              : 'Detected from message structure.'}
          </p>
        )}

        {detectedTransactions.length > 0 && confidence !== null && (
          <Card className="p-3 bg-accent/10 border-accent/30">
            <h3 className="text-sm font-medium mb-2">What we found</h3>
            <div className="text-sm space-y-1">
              <p>
                Detection basis:{' '}
                <span className="font-medium">
                  {matchOrigin === 'template'
                    ? 'Based on your saved patterns'
                    : matchOrigin === 'fallback'
                    ? 'Estimated from message text'
                    : matchOrigin === 'ml'
                    ? 'Estimated from message text'
                    : 'Detected from message structure'}
                </span>
              </p>
              <p>
                Important details captured:{' '}
                <span className="font-medium">{extractedFieldCount}/4</span>
              </p>
              <p>
                Currency:{' '}
                <span className="font-medium">{detectedTransactions[0].currency || 'Unknown'}</span>
              </p>
              <p>
                How sure we are:{' '}
                <span className="font-medium">{(confidence * 100).toFixed(0)}%</span>
              </p>
              {(matchedCount !== null || totalTemplates !== null) && (
                <p className="text-muted-foreground">
                  Saved patterns recognized: {matchedCount ?? 0}/{totalTemplates ?? 0}
                </p>
              )}
              {detectedTransactions[0].category === 'Uncategorized' && (
                <p className="text-warning">Category still needs your confirmation.</p>
              )}
            </div>
          </Card>
        )}
      </form>


      {detectedTransactions.length > 0 && (
        <div className="space-y-3 mt-2">
          <h3 className="text-sm font-medium">Detected transaction preview</h3>
          {detectedTransactions.map((txn) => (
            <DetectedTransactionCard
              key={txn.id}
              transaction={txn}
              isSmartMatch={true}
              onAddTransaction={handleAddTransaction}
              origin={matchOrigin ?? undefined}
            />
          ))}
        </div>
      )}

      <NoTransactionMessage
        show={!isSubmitted && !isProcessing && text.trim() && detectedTransactions.length === 0 && !error}
        message={matchStatus}
        matched={hasMatch}
      />
    </div>
  );
};

export default SmartPaste;
