
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useLearningEngine } from '@/hooks/useLearningEngine';
import { Transaction } from '@/types/transaction';
import { useSmartPaste } from '@/hooks/useSmartPaste';
import { Loader2 } from 'lucide-react';
import { Label } from './ui/label';
import TransactionInput from './smart-paste/TransactionInput';
import DetectedTransactionCard from './smart-paste/DetectedTransactionCard';

interface SmartPasteProps {
  senderHint?: string;
  onTransactionsDetected?: (transactions: Transaction[], rawMessage?: string, senderHint?: string, confidence?: number) => void;
}

const SmartPaste = ({ senderHint, onTransactionsDetected }: SmartPasteProps) => {
  const {
    text,
    setText,
    detectedTransactions,
    setDetectedTransactions,
    isSmartMatch,
    isProcessing,
    error,
    handlePaste,
    processText
  } = useSmartPaste(onTransactionsDetected);

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
    processText(text);
  };

  const handleAddTransaction = (transaction: Transaction) => {
    if (onTransactionsDetected) {
      onTransactionsDetected([transaction], text, senderHint, isSmartMatch ? 0.8 : 0.5);
    }
    
    toast({
      title: "Transaction added",
      description: `Added ${transaction.title} (${transaction.amount})`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Smart Paste</CardTitle>
        <CardDescription>
          Paste a message from your bank or SMS app to automatically extract
          transaction details.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Paste your message here..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="min-h-[100px]"
              dir="auto" // Auto-detect text direction for Arabic
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
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

        {error && (
          <div className="p-3 text-sm border border-orange-200 bg-orange-50 text-orange-700 rounded-md">
            {error}
          </div>
        )}

        {detectedTransactions.length > 0 && (
          <div className="space-y-3 mt-2">
            <h3 className="text-sm font-medium">Detected Transaction:</h3>
            {detectedTransactions.map(transaction => (
              <DetectedTransactionCard
                key={transaction.id}
                transaction={transaction}
                isSmartMatch={isSmartMatch}
                onAddTransaction={handleAddTransaction}
              />
            ))}
          </div>
        )}

        {!isProcessing && text.trim() && detectedTransactions.length === 0 && !error && (
          <div className="py-4 text-center text-sm text-muted-foreground">
            Press "Capture Message" to analyze the text
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SmartPaste;
