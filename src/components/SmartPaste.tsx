
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clipboard, Plus, AlertTriangle, CheckCircle2, RefreshCcw, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { messageProcessingService } from '@/services/MessageProcessingService';
import { Transaction, TransactionType } from '@/types/transaction';

interface SmartPasteProps {
  onTransactionsDetected: (transactions: Transaction[]) => void;
}

const SmartPaste: React.FC<SmartPasteProps> = ({ onTransactionsDetected }) => {
  const [pasteContent, setPasteContent] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectedTransactions, setDetectedTransactions] = useState<Transaction[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const clipboardText = e.clipboardData.getData('text');
    if (clipboardText) {
      setPasteContent(clipboardText);
      processText(clipboardText);
    }
  };

  const processText = (text: string) => {
    setIsProcessing(true);
    try {
      // Process the pasted text to extract transaction data
      const transaction = messageProcessingService.processMessageText(text);
      
      if (transaction) {
        setDetectedTransactions([transaction]);
        toast({
          title: "Transaction detected!",
          description: `Found a ${transaction.type} of ${Math.abs(transaction.amount)} ${transaction.currency}`,
        });
      } else {
        toast({
          title: "No transaction detected",
          description: "We couldn't identify a transaction in the pasted text. Try adjusting the text or paste a different message.",
          variant: "destructive",
        });
        setDetectedTransactions([]);
      }
    } catch (error) {
      console.error("Error processing text:", error);
      toast({
        title: "Processing error",
        description: "An error occurred while processing the text. Please try again.",
        variant: "destructive",
      });
      setDetectedTransactions([]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImportTransactions = () => {
    if (detectedTransactions.length > 0) {
      onTransactionsDetected(detectedTransactions);
      setPasteContent('');
      setDetectedTransactions([]);
    }
  };

  const handleClear = () => {
    setPasteContent('');
    setDetectedTransactions([]);
  };

  const handleEdit = (transaction: Transaction) => {
    // Navigate to the edit transaction page with the transaction data
    navigate('/edit-transaction', { state: { transaction } });
  };

  const handleAddManually = () => {
    // Navigate to the add transaction page
    navigate('/edit-transaction');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-4 border rounded-lg space-y-4"
    >
      <div className="flex items-center gap-2 mb-2">
        <Clipboard className="text-primary h-5 w-5" />
        <h3 className="text-lg font-medium">Smart Paste</h3>
      </div>
      
      <div className="space-y-2">
        <label htmlFor="paste-area" className="text-sm text-muted-foreground">
          Paste your transaction message below:
        </label>
        <Textarea
          id="paste-area"
          value={pasteContent}
          onChange={(e) => setPasteContent(e.target.value)}
          onPaste={handlePaste}
          placeholder="Paste a bank transaction SMS or notification here..."
          className="min-h-[120px] font-mono text-sm"
        />
      </div>
      
      {detectedTransactions.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-1">
            <CheckCircle2 className="text-green-500 h-4 w-4" />
            Detected Transaction
          </h4>
          
          {detectedTransactions.map(transaction => (
            <motion.div
              key={transaction.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-3 bg-secondary rounded-md text-sm"
            >
              <div className="flex justify-between">
                <span className="font-medium">{transaction.title}</span>
                <span className={transaction.type === 'expense' ? 'text-red-500' : 'text-green-500'}>
                  {transaction.type === 'expense' ? '-' : '+'}{Math.abs(transaction.amount)} {transaction.currency}
                </span>
              </div>
              <div className="text-muted-foreground text-xs mt-1">
                {transaction.category} • {transaction.date}
              </div>
              <div className="flex justify-end mt-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleEdit(transaction)}
                  className="flex items-center gap-1"
                >
                  <Edit className="h-3 w-3" /> Edit
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
      
      <div className="flex gap-2">
        <Button 
          className="flex-1" 
          onClick={() => processText(pasteContent)}
          disabled={!pasteContent || isProcessing}
        >
          {isProcessing ? (
            <>
              <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              Detect Transaction
            </>
          )}
        </Button>
        
        <Button 
          variant="outline" 
          onClick={handleClear}
          disabled={!pasteContent && detectedTransactions.length === 0}
        >
          Clear
        </Button>
      </div>
      
      {detectedTransactions.length > 0 ? (
        <Button 
          variant="default"
          className="w-full"
          onClick={handleImportTransactions}
        >
          Import Transaction
        </Button>
      ) : (
        <Button 
          variant="outline"
          className="w-full"
          onClick={handleAddManually}
        >
          Add Transaction Manually
        </Button>
      )}
      
      <div className="text-xs text-muted-foreground border-t pt-2">
        <div className="flex items-start gap-1">
          <AlertTriangle className="text-amber-500 h-4 w-4 flex-shrink-0 mt-0.5" />
          <p>
            For best results, paste the complete message from your bank notification.
            We support various message formats from major banks.
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default SmartPaste;
