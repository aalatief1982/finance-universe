
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useLearningEngine } from '@/hooks/useLearningEngine';
import { Transaction } from '@/types/transaction';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useNavigate } from 'react-router-dom';

interface SmartPasteProps {
  senderHint?: string;
  onTransactionsDetected?: (transactions: Transaction[], rawMessage?: string, senderHint?: string, confidence?: number) => void;
}

const SmartPaste = ({ senderHint, onTransactionsDetected }: SmartPasteProps) => {
  const [message, setMessage] = useState('');
  const [inferredTransaction, setInferredTransaction] = useState<Partial<Transaction> | null>(null);
  const { toast } = useToast();
  const { findBestMatch, inferFieldsFromText } = useLearningEngine();
  const navigate = useNavigate();

  const handleCaptureMessage = (event: React.FormEvent) => {
    event.preventDefault();
    if (!message.trim()) {
      toast({
        title: "Error",
        description: "Message cannot be empty",
        variant: "destructive",
      })
      return;
    }

    const results = findBestMatch(message, '');
    
    if (results.matched && results.entry) {
      // Display matched entry
      toast({
        title: "Matched!",
        description: (
          <div>
            <p>Matched with confidence: {results.confidence.toFixed(2)}</p>
            <pre>{JSON.stringify(results.entry.confirmedFields, null, 2)}</pre>
          </div>
        ),
      });
      
      // Call the callback if provided
      if (onTransactionsDetected && results.entry.confirmedFields) {
        onTransactionsDetected([results.entry.confirmedFields as Transaction], message, senderHint, results.confidence);
      }
    } else {
      // If match confidence is low, offer to train the model
      if (results.confidence < 0.5) {
        // Show toast with option to train model
        toast({
          title: "Low match confidence",
          description: (
            <div className="flex flex-col gap-2">
              <p>This message doesn't match any known patterns well.</p>
              <Button 
                onClick={() => {
                  navigate('/train-model', { 
                    state: { message, sender: senderHint }
                  });
                }}
                size="sm"
              >
                Train Model
              </Button>
            </div>
          ),
        });
      }
      
      const inferredTransaction = inferFieldsFromText(message);
      
      if (inferredTransaction) {
        setInferredTransaction(inferredTransaction);
        toast({
          title: "Inferred Transaction",
          description: (
            <div>
              <p>Could not find a good match, but here's what we inferred:</p>
              <pre>{JSON.stringify(inferredTransaction, null, 2)}</pre>
            </div>
          ),
        });
        
        // Call the callback with inferred transaction if provided
        if (onTransactionsDetected && inferredTransaction.amount !== undefined) {
          onTransactionsDetected([inferredTransaction as Transaction], message, senderHint, 0.3);
        }
      } else {
        toast({
          title: "No Match Found",
          description: "Could not find a match or infer transaction details.",
        });
      }
    }
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
        <div className="grid gap-2">
          <Label htmlFor="message">Message</Label>
          <Textarea
            id="message"
            placeholder="Paste your message here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>
        <Button onClick={handleCaptureMessage}>Capture Message</Button>

        {inferredTransaction && (
          <div className="mt-4">
            <h3>Inferred Transaction Details:</h3>
            <pre>{JSON.stringify(inferredTransaction, null, 2)}</pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SmartPaste;
