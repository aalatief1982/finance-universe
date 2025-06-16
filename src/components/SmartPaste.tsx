
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Transaction, TransactionType } from '@/types/transaction';
import { Loader2, ZapIcon } from 'lucide-react';
import { Label } from './ui/label';
import DetectedTransactionCard from './smart-paste/DetectedTransactionCard';
import ErrorAlert from './smart-paste/ErrorAlert';
import NoTransactionMessage from './smart-paste/NoTransactionMessage';
import { Switch } from './ui/switch';
import { parseSmsMessage } from '@/lib/smart-paste-engine/smsParser';
import { nanoid } from 'nanoid';
import { parseAndInferTransaction } from '@/lib/smart-paste-engine/parseAndInferTransaction';
import { isFinancialTransactionMessage } from '@/lib/smart-paste-engine/messageFilter';


import {
  getFieldConfidence,
  getTemplateConfidence,
  getKeywordConfidence,
  computeOverallConfidence,
} from '@/lib/smart-paste-engine/confidenceScoring';
import { loadKeywordBank } from '@/lib/smart-paste-engine/keywordBankUtils';
import { getAllTemplates } from '@/lib/smart-paste-engine/templateUtils';

interface SmartPasteProps {
  senderHint?: string;
  onTransactionsDetected?: (
    transactions: Transaction[],
    rawMessage?: string,
    senderHint?: string,
    confidence?: number,
    shouldTrain?: boolean,
    matchOrigin?: "template" | "structure" | "ml" | "fallback"
  ) => void;
}

const SmartPaste = ({ senderHint, onTransactionsDetected }: SmartPasteProps) => {
  const [text, setText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [useHighAccuracy, setUseHighAccuracy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detectedTransactions, setDetectedTransactions] = useState<Transaction[]>([]);
  
  const { toast } = useToast();

const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();

  if (!text.trim()) {
    toast({
      title: "Error",
      description: "Please paste or enter a message first",
      variant: "destructive",
    });
    return;
  }
 console.log('[SmartPaste] Checking message:', text);
  // 🚫 Check if message contains financial transaction pattern
  if (!isFinancialTransactionMessage(text)) {
    toast({
      title: "Non-transactional message",
      description: "This message does not appear to contain any transaction data.",
      variant: "default",
    });
    return;
  }

  console.log("[SmartPaste] Submitting message:", text);
  setIsProcessing(true);
  setError(null);

  try {
    const {
      transaction,
      confidence,
      origin,
      parsed
    } = parseAndInferTransaction(text, senderHint);

    console.log("[SmartPaste] Parsed result:", parsed);
    console.log("[SmartPaste] Confidence Breakdown:", {
      confidence,
      origin
    });

    setDetectedTransactions([transaction]);

    if (onTransactionsDetected) {
      console.log("[SmartPaste] Final transaction inference:", transaction);
      onTransactionsDetected(
        [transaction],
        text,
        transaction.fromAccount,
        confidence,
        origin === 'template' || origin === 'ml',
        origin
      );
    }
  } catch (err: any) {
    console.error("[SmartPaste] Error in structure parsing:", err);
    setError("Could not parse the message. Try again or report.");
  } finally {
    setIsProcessing(false);
  }
};

  const handlePaste = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      console.log("[SmartPaste] Clipboard text captured:", clipboardText);
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
    console.log('[SmartPaste] Sending transaction to ImportTransactions:', {
      transaction,
      parsedFields: {
        amount: transaction.amount,
        currency: transaction.currency,
        date: transaction.date,
        type: transaction.type,
        category: transaction.category,
        vendor: transaction.vendor,
        fromAccount: transaction.fromAccount,
      }
    });  
    
    console.log("[SmartPaste] Transaction added:", transaction);
    if (onTransactionsDetected) {
      onTransactionsDetected([transaction], text, senderHint, 0.95, true, 'structure');
    }

    toast({
      title: "Transaction added",
      description: `Added ${transaction.title || transaction.vendor} (${transaction.amount})`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Smart Paste</CardTitle>
        <CardDescription>
          Paste a message from your bank or SMS app to automatically extract transaction details.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Paste your message here..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="min-h-[100px]"
              dir="auto"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:justify-start gap-2">
            <Button type="submit" disabled={isProcessing || !text.trim()}>
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Capture Message
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handlePaste}
              disabled={isProcessing}
            >
              Paste from Clipboard
            </Button>
          </div>
        </form>

        <ErrorAlert error={error} />

        {detectedTransactions.length > 0 && (
          <div className="space-y-3 mt-2">
            <h3 className="text-sm font-medium">Detected Transaction:</h3>
            {detectedTransactions.map((txn) => (
              <DetectedTransactionCard
                key={txn.id}
                transaction={txn}
                isSmartMatch={true}
                onAddTransaction={handleAddTransaction}
                origin="structure"
              />
            ))}
          </div>
        )}

        <NoTransactionMessage
          show={!isProcessing && text.trim() && detectedTransactions.length === 0 && !error}
        />
      </CardContent>
    </Card>
  );
};

export default SmartPaste;
