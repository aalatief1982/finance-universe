import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MessageSquare, Check, Clock, Pause, Play, AlertTriangle } from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import SmsTransactionConfirmation from '@/components/SmsTransactionConfirmation';
import SmsPermissionRequest from '@/components/SmsPermissionRequest';
import { useToast } from '@/components/ui/use-toast';
import { getMockSmsMessages, parseSmsMessage } from '@/lib/sms-parser';
import { v4 as uuidv4 } from 'uuid';

const ProcessSmsMessages = () => {
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [totalMessages, setTotalMessages] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);
  const [currentTransaction, setCurrentTransaction] = useState<any>(null);
  const [confirmedTransactions, setConfirmedTransactions] = useState<any[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Skip permission if already granted (could be stored in localStorage in a real app)
    const savedPermission = localStorage.getItem('smsPermissionGranted');
    if (savedPermission === 'true') {
      setPermissionGranted(true);
    }
  }, []);

  const handlePermissionGranted = () => {
    setPermissionGranted(true);
    localStorage.setItem('smsPermissionGranted', 'true');
    startProcessing();
  };

  const handlePermissionDenied = () => {
    toast({
      title: "Limited functionality",
      description: "You can still use manual entry for your transactions",
    });
    navigate('/dashboard');
  };

  const startProcessing = () => {
    setIsProcessing(true);
    setIsPaused(false);
    
    // In a real app, we would access actual SMS messages
    // For now, we'll use mocks
    const mockMessages = getMockSmsMessages();
    setTotalMessages(mockMessages.length);
    
    // Process the first message
    processNextMessage(mockMessages, 0, []);
  };

  const processNextMessage = (messages: any[], index: number, confirmed: any[]) => {
    if (index >= messages.length) {
      // All messages processed
      finishProcessing(confirmed);
      return;
    }

    const message = messages[index];
    const parsedTransaction = parseSmsMessage(message.message, message.sender);
    
    if (parsedTransaction) {
      // Show the transaction for confirmation
      setCurrentTransaction({
        id: uuidv4(),
        message: message.message,
        sender: message.sender,
        amount: parsedTransaction.amount,
        date: message.date.toLocaleDateString(),
        inferredCategory: parsedTransaction.category,
        description: parsedTransaction.description,
      });
    } else {
      // Skip this message if it couldn't be parsed
      processNextMessage(messages, index + 1, confirmed);
    }
    
    setProcessedCount(index + 1);
    setProgress(((index + 1) / messages.length) * 100);
  };

  const handleConfirmTransaction = (transaction: any) => {
    const updatedConfirmed = [...confirmedTransactions, transaction];
    setConfirmedTransactions(updatedConfirmed);
    
    // Get mock messages again (in a real app we'd keep track of the original array)
    const mockMessages = getMockSmsMessages();
    const nextIndex = processedCount;
    
    if (nextIndex < mockMessages.length) {
      processNextMessage(mockMessages, nextIndex, updatedConfirmed);
    } else {
      finishProcessing(updatedConfirmed);
    }
  };

  const handleDeclineTransaction = (id: string) => {
    // Skip this transaction and move to the next
    const mockMessages = getMockSmsMessages();
    const nextIndex = processedCount;
    
    if (nextIndex < mockMessages.length) {
      processNextMessage(mockMessages, nextIndex, confirmedTransactions);
    } else {
      finishProcessing(confirmedTransactions);
    }
  };

  const handleEditTransaction = (transaction: any) => {
    // Update the current transaction
    setCurrentTransaction(transaction);
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  const finishProcessing = (confirmedTransactions: any[]) => {
    setIsProcessing(false);
    setCurrentTransaction(null);
    
    // In a real app, save these transactions to your state management or database
    if (confirmedTransactions.length > 0) {
      // Convert to the format used by our transaction store
      const formattedTransactions = confirmedTransactions.map(t => ({
        id: t.id,
        title: t.description,
        amount: t.amount,
        category: t.inferredCategory,
        date: new Date(t.date).toISOString(),
        type: t.amount < 0 ? 'expense' : 'income',
        notes: t.message,
      }));
      
      // Get existing transactions from localStorage
      const existingTransactionsJSON = localStorage.getItem('transactions');
      const existingTransactions = existingTransactionsJSON ? JSON.parse(existingTransactionsJSON) : [];
      
      // Merge new transactions with existing ones
      const allTransactions = [...formattedTransactions, ...existingTransactions];
      
      // Save back to localStorage
      localStorage.setItem('transactions', JSON.stringify(allTransactions));
    }
    
    toast({
      title: "Processing complete",
      description: `${confirmedTransactions.length} transactions imported successfully`,
    });
    
    navigate('/dashboard');
  };

  if (!permissionGranted) {
    return (
      <Layout>
        <div className="max-w-md mx-auto mt-8">
          <SmsPermissionRequest 
            onGranted={handlePermissionGranted}
            onDenied={handlePermissionDenied}
          />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md mx-auto space-y-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate('/dashboard')}
              className="mr-2"
            >
              <ArrowLeft size={20} />
            </Button>
            <h1 className="text-2xl font-bold">Process SMS Messages</h1>
          </div>
          
          {isProcessing && (
            <Button 
              variant="outline" 
              size="icon"
              onClick={togglePause}
            >
              {isPaused ? <Play size={20} /> : <Pause size={20} />}
            </Button>
          )}
        </div>
        
        {isProcessing && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Processing messages: {processedCount} of {totalMessages}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} />
            </div>
            
            {isPaused && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center text-yellow-800">
                <Clock className="shrink-0 mr-2 text-yellow-500" size={20} />
                <p className="text-sm">Processing paused. Resume to continue.</p>
              </div>
            )}
            
            {currentTransaction && !isPaused && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Review this transaction:</p>
                <SmsTransactionConfirmation
                  transaction={currentTransaction}
                  onConfirm={handleConfirmTransaction}
                  onDecline={handleDeclineTransaction}
                  onEdit={handleEditTransaction}
                />
              </div>
            )}
          </div>
        )}
        
        {!isProcessing && (
          <div className="space-y-6 text-center">
            <div className="mx-auto bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center">
              <MessageSquare className="text-primary h-10 w-10" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Process SMS Messages</h2>
              <p className="text-muted-foreground">
                We'll scan your SMS messages from financial institutions to extract transaction data automatically.
              </p>
            </div>
            
            <div className="flex items-start bg-secondary p-4 rounded-lg text-left">
              <AlertTriangle className="text-amber-500 mr-3 mt-1 shrink-0" size={20} />
              <div className="space-y-1">
                <p className="font-medium">Batch Processing</p>
                <p className="text-sm text-muted-foreground">
                  You'll be asked to confirm each transaction we extract. You can pause at any time.
                </p>
              </div>
            </div>
            
            <Button 
              onClick={startProcessing}
              className="w-full"
            >
              Start Processing
            </Button>
          </div>
        )}
      </motion.div>
    </Layout>
  );
};

export default ProcessSmsMessages;
