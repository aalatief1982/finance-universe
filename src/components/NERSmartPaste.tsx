/**
 * @file NERSmartPaste.tsx
 * @description UI component for NERSmartPaste.
 *
 * @module components/NERSmartPaste
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
import React, { useState } from 'react';
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Transaction } from '@/types/transaction';
import { Loader2 } from 'lucide-react';
import { Label } from './ui/label';
import DetectedTransactionCard from './smart-paste/DetectedTransactionCard';
import NoTransactionMessage from './smart-paste/NoTransactionMessage';
import { extractTransactionEntities } from '@/services/MLTransactionParser';
import { logAnalyticsEvent } from '@/utils/firebase-analytics';
import { parseAndInferTransaction } from '@/lib/smart-paste-engine/parseAndInferTransaction';
import { useLanguage } from '@/i18n/LanguageContext';

// SmartPaste component that uses regex-based extraction to parse transaction entities.
// The learning engine will still learn from the saved transaction in the edit screen.

interface NERSmartPasteProps {
  senderHint?: string;
  onTransactionsDetected?: (
    transactions: Transaction[],
    rawMessage?: string,
    senderHint?: string,
    confidence?: number,
    matchOrigin?: "template" | "structure" | "ml" | "fallback",
    parsingStatus?: 'success' | 'partial' | 'failed',
    matchedCount?: number,
    totalTemplates?: number,
    fieldScore?: number,
    keywordScore?: number,
    fieldConfidences?: Record<string, number>
  ) => void;
}

const NERSmartPaste = ({ senderHint, onTransactionsDetected }: NERSmartPasteProps) => {
  const { t } = useLanguage();
  const [text, setText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detectedTransactions, setDetectedTransactions] = useState<Transaction[]>([]);
  const [matchStatus, setMatchStatus] = useState(t('smartEntry.pasteToBegin'));
  const [hasMatch, setHasMatch] = useState(false);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [matchOrigin, setMatchOrigin] = useState<'template' | 'structure' | 'ml' | 'fallback' | null>(null);

  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!text.trim()) {
      toast({
        title: t('toast.smartEntry.noMessage'),
        description: t('toast.smartEntry.noMessageDesc'),
        variant: "destructive",
      });
      return;
    }
    if (import.meta.env.MODE === 'development') {
      // console.log('[SmartPaste] Submitting message:', text);
    }
    setIsProcessing(true);
    setError(null);
    setConfidence(null);
    setMatchOrigin(null);
    logAnalyticsEvent('smart_paste_sms');

    try {
      const parsed = await extractTransactionEntities(text);
      if (import.meta.env.MODE === 'development') {
        // console.log('[SmartPaste] Extracted entities:', parsed);
      }

      const result = await parseAndInferTransaction(text, senderHint);
      const transaction = result.transaction;
      
      setDetectedTransactions([transaction]);
      setConfidence(result.confidence);
      setMatchOrigin(result.origin);
      setHasMatch(!!parsed.amount);

      if (onTransactionsDetected) {
        if (import.meta.env.MODE === 'development') {
          // console.log('[SmartPaste] Final transaction:', transaction);
        }
        onTransactionsDetected(
          [transaction],
          text,
          senderHint,
          result.confidence,
          result.origin,
          result.parsingStatus,
          result.matchedCount,
          result.totalTemplates,
          result.fieldScore,
          result.keywordScore,
          result.fieldConfidences
        );
      }
    } catch (err: unknown) {
      if (import.meta.env.MODE === 'development') {
        console.error('[SmartPaste] Extraction error:', err);
      }
      setError(t('smartEntry.parseError'));
      toast({
        title: t('toast.smartEntry.parseFailed'),
        description: t('toast.smartEntry.parseFailedDesc'),
        variant: "destructive",
      });
      setConfidence(null);
      setMatchOrigin(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaste = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      if (import.meta.env.MODE === 'development') {
        // console.log('[SmartPaste] Clipboard text captured:', clipboardText);
      }
      setText(clipboardText);
    } catch (err) {
      toast({
        title: t('toast.smartEntry.clipboardFailed'),
        description: t('toast.smartEntry.clipboardFailedDesc'),
        variant: "destructive",
      });
    }
  };

  const handleAddTransaction = (transaction: Transaction) => {
    // if (import.meta.env.MODE === 'development') console.log('[SmartPaste] Sending transaction:', {
      // transaction,
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
    
    if (onTransactionsDetected) {
      onTransactionsDetected(
        [transaction],
        text,
        senderHint,
        confidence || 0.95,
        matchOrigin || 'structure',
        undefined,
        0,
        0,
        undefined,
        undefined,
        undefined
      );
    }

    logAnalyticsEvent('smart_paste_save');

  };

  return (
    <div className="pt-4 space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {t('smartEntry.instructions')}
        </p>
        <div className="grid gap-2">
          <Label htmlFor="message">{t('smartEntry.label')}</Label>
          <Textarea
            id="message"
            placeholder={t('smartEntry.placeholder')}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[100px]"
            dir="auto"
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:justify-start gap-2">
          <Button type="submit" disabled={isProcessing || !text.trim()}>
            {isProcessing && <Loader2 className="ltr:mr-2 rtl:ml-2 h-4 w-4 animate-spin" />}
            {t('smartEntry.reviewButton')}
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
            {t('smartEntry.confidenceLabel')} {(confidence * 100).toFixed(0)}% -{' '}
            {matchOrigin === 'template'
              ? t('smartEntry.matchedTemplate.label')
              : matchOrigin === 'ml'
              ? t('smartEntry.parsedFromText')
              : matchOrigin === 'fallback'
              ? t('smartEntry.basicGuess')
              : t('smartEntry.structureMatch')}
          </p>
        )}
      </form>

      {detectedTransactions.length > 0 && (
        <div className="space-y-3 mt-2">
          <h3 className="text-sm font-medium">{t('smartEntry.detectedTransaction')}</h3>
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
        show={!isProcessing && text.trim() && detectedTransactions.length === 0 && !error}
        message={matchStatus}
        matched={hasMatch}
      />
    </div>
  );
};

export default NERSmartPaste;
