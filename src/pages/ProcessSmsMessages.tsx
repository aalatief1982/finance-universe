
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageSquare, AlertTriangle, Check, ArrowLeft, RefreshCw } from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { smsProviderSelectionService } from '@/services/SmsProviderSelectionService';
import { smsPermissionService } from '@/services/SmsPermissionService';
import { Transaction } from '@/types/transaction';
import { useTransactions } from '@/context/TransactionContext';

// This component would handle importing transactions from SMS
const ProcessSmsMessages = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [foundMessages, setFoundMessages] = useState(0);
  const [processedMessages, setProcessedMessages] = useState(0);
  const [extractedTransactions, setExtractedTransactions] = useState<Transaction[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addBatchTransactions } = useTransactions();

  useEffect(() => {
    // Check if SMS permission is granted
    if (!smsPermissionService.hasPermission()) {
      toast({
        title: "Permission required",
        description: "SMS permission is needed to process messages",
        variant: "destructive",
      });
      navigate('/dashboard');
    }
    
    // Check if providers are selected
    const selectedProviders = smsProviderSelectionService.getSelectedProviders();
    if (selectedProviders.length === 0) {
      toast({
        title: "No providers selected",
        description: "Please select SMS providers first",
        variant: "destructive",
      });
      navigate('/sms-providers');
    }
  }, [navigate, toast]);

  const startProcessing = async () => {
    setIsProcessing(true);
    setProgress(0);
    setFoundMessages(0);
    setProcessedMessages(0);
    setExtractedTransactions([]);
    
    try {
      // In a real implementation, this would access actual SMS messages
      // through a Capacitor plugin
      const messages = await smsProviderSelectionService.accessNativeSms();
      
      if (messages.length === 0) {
        toast({
          title: "No messages found",
          description: "We couldn't find any SMS messages to analyze",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }
      
      setFoundMessages(messages.length);
      
      // Get selected providers
      const selectedProviders = smsProviderSelectionService.getSelectedProviders();
      
      // Process messages in batches
      const transactions: Transaction[] = [];
      
      // In a real implementation, we would process messages in batches
      // and extract transaction data
      for (let i = 0; i < messages.length; i++) {
        // Update progress
        setProgress(Math.floor((i / messages.length) * 100));
        setProcessedMessages(i + 1);
        
        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // Check if message is from a selected provider
        const provider = selectedProviders.find(p => 
          messages[i].address.toLowerCase().includes(p.name.toLowerCase()) ||
          p.name.toLowerCase().includes(messages[i].address.toLowerCase())
        );
        
        if (provider) {
          // Extract transaction data from message
          // In a real implementation, this would use regex patterns to extract
          // amount, date, merchant, etc.
          
          // For now, just create a dummy transaction
          const transaction: Transaction = {
            id: `sms-${Date.now()}-${i}`,
            title: `Transaction from ${provider.name}`,
            amount: Math.random() > 0.5 ? -Math.floor(Math.random() * 100) : Math.floor(Math.random() * 100),
            date: new Date(),
            category: 'other',
            type: Math.random() > 0.5 ? 'expense' : 'income',
            source: 'sms',
          };
          
          transactions.push(transaction);
        }
      }
      
      setExtractedTransactions(transactions);
      setProgress(100);
      
      // Done
      if (transactions.length > 0) {
        // Add transactions to store
        addBatchTransactions(transactions);
        
        toast({
          title: "Processing complete",
          description: `Extracted ${transactions.length} transactions from ${processedMessages} messages`,
        });
      } else {
        toast({
          title: "No transactions found",
          description: "We couldn't find any transactions in your messages",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error processing SMS:', error);
      toast({
        title: "Error processing SMS",
        description: "There was a problem processing your SMS messages",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      
      // Even in error case, set progress to 100 to avoid stuck progress bar
      setProgress(100);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleFinish = () => {
    navigate('/transactions');
  };

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md mx-auto space-y-6"
      >
        <div className="flex items-center justify-between">
          <button 
            onClick={handleBack}
            className="p-2 -ml-2 rounded-full hover:bg-secondary"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold">Process SMS Messages</h1>
          <div className="w-8"></div>
        </div>
        
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 text-center space-y-4">
          <div className="mx-auto bg-primary/20 w-16 h-16 rounded-full flex items-center justify-center">
            <MessageSquare className="text-primary h-8 w-8" />
          </div>
          
          <div>
            <h2 className="text-xl font-bold mb-1">Import Transactions from SMS</h2>
            <p className="text-sm text-muted-foreground">
              We'll scan your SMS messages for transactions from your selected financial institutions.
            </p>
          </div>
          
          {isProcessing ? (
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Scanning messages...</span>
                  <span>{processedMessages} of {foundMessages}</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
              
              <div className="flex items-center justify-center">
                <RefreshCw className="animate-spin mr-2 h-5 w-5 text-primary" />
                <span>Processing... Please wait</span>
              </div>
            </div>
          ) : extractedTransactions.length > 0 ? (
            <div className="space-y-4 py-2">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                <Check className="text-green-500 mt-0.5" size={18} />
                <div className="text-left">
                  <h3 className="font-medium text-green-800">Import Complete!</h3>
                  <p className="text-sm text-green-700">
                    We've extracted {extractedTransactions.length} transactions from {processedMessages} messages.
                  </p>
                </div>
              </div>
              
              <div className="pt-2">
                <Button onClick={handleFinish} className="w-full">
                  View Transactions
                </Button>
              </div>
            </div>
          ) : progress === 100 ? (
            <div className="space-y-4 py-2">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                <AlertTriangle className="text-amber-500 mt-0.5" size={18} />
                <div className="text-left">
                  <h3 className="font-medium text-amber-800">No Transactions Found</h3>
                  <p className="text-sm text-amber-700">
                    We couldn't find any transactions in the {processedMessages} messages we scanned.
                  </p>
                </div>
              </div>
              
              <div className="pt-2">
                <Button onClick={startProcessing} className="w-full">
                  Try Again
                </Button>
              </div>
            </div>
          ) : (
            <div className="pt-4">
              <Button 
                onClick={startProcessing} 
                className="w-full" 
                size="lg"
              >
                Start Scanning
              </Button>
            </div>
          )}
        </div>
        
        {!isProcessing && extractedTransactions.length === 0 && progress !== 100 && (
          <div className="space-y-4">
            <div className="flex items-start bg-secondary p-4 rounded-lg text-left">
              <AlertTriangle className="text-amber-500 mr-3 mt-1 shrink-0" size={20} />
              <div className="space-y-1">
                <p className="font-medium">Privacy First</p>
                <p className="text-sm text-muted-foreground">
                  We only scan messages from the financial institutions you selected. Your personal messages remain private.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {!isProcessing && progress !== 100 && (
          <Button 
            variant="outline" 
            onClick={handleBack} 
            className="w-full"
          >
            Cancel
          </Button>
        )}
      </motion.div>
    </Layout>
  );
};

export default ProcessSmsMessages;
