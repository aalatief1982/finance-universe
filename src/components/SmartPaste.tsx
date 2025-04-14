
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useLearningEngine } from '@/hooks/useLearningEngine';
import { Transaction } from '@/types/transaction';
import { useSmartPaste } from '@/hooks/useSmartPaste';
import { Loader2, ZapIcon } from 'lucide-react';
import { Label } from './ui/label';
import TransactionInput from './smart-paste/TransactionInput';
import DetectedTransactionCard from './smart-paste/DetectedTransactionCard';
import ErrorAlert from './smart-paste/ErrorAlert';
import NoTransactionMessage from './smart-paste/NoTransactionMessage';
import { Switch } from './ui/switch';

interface SmartPasteProps {
  senderHint?: string;
  onTransactionsDetected?: (transactions: Transaction[], rawMessage?: string, senderHint?: string, confidence?: number,matchOrigin?: "template" | "structure" | "ml" | "fallback") => void;
}

const SmartPaste = ({ senderHint, onTransactionsDetected }: SmartPasteProps) => {
  const [useHighAccuracy, setUseHighAccuracy] = useState(false);
  
  const {
    text,
    setText,
    detectedTransactions,
    setDetectedTransactions,
    isSmartMatch,
    isProcessing,
    error,
    handlePaste,
    processText,
    structureMatch,
    setCurrentSenderHint
  } = useSmartPaste(onTransactionsDetected, useHighAccuracy);

  const { toast } = useToast();
  
  // Set the senderHint when it changes
  useEffect(() => {
    if (senderHint) {
      setCurrentSenderHint(senderHint);
    }
  }, [senderHint, setCurrentSenderHint]);
  
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
          
          <div className="flex items-center space-x-2">
            <Switch 
              id="high-accuracy" 
              checked={useHighAccuracy}
              onCheckedChange={setUseHighAccuracy}
            />
            <Label htmlFor="high-accuracy" className="flex items-center text-sm">
              <ZapIcon className="w-4 h-4 mr-1" /> 
              High accuracy mode (slower)
            </Label>
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

        <ErrorAlert error={error} />

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

        <NoTransactionMessage 
          show={!isProcessing && text.trim() && detectedTransactions.length === 0 && !error} 
        />

        {structureMatch && (
          <div className="border border-purple-400 bg-purple-50 dark:bg-purple-900/20 text-sm text-purple-800 dark:text-purple-200 p-4 rounded-md">
            <p><strong>Structure Match Debug:</strong></p>
            <p><strong>Matched Template Hash:</strong> {structureMatch.templateHash}</p>
            <p><strong>Confidence:</strong> {Math.round(structureMatch.confidence * 100)}%</p>
            <p><strong>Matched Fields:</strong></p>
            <ul className="list-disc list-inside ml-4">
              {Object.entries(structureMatch.inferredTransaction).map(([key, value]) => (
                <li key={key}><strong>{key}:</strong> {value?.toString()}</li>
              ))}
            </ul>
          </div>
        )}

      </CardContent>
    </Card>
  );
};

export default SmartPaste;
