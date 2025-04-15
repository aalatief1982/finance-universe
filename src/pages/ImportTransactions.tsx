
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import TelegramBotSetup from '@/components/TelegramBotSetup';
import SmartPaste from '@/components/SmartPaste';
import { Transaction } from '@/types/transaction';
import { useTransactions } from '@/context/TransactionContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { learningEngineService } from '@/services/LearningEngineService';

/**
 * ImportTransactions page component for handling different import methods.
 * Provides UI for smart paste and Telegram bot setup methods.
 * Manages the transaction detection flow and forwards to edit page.
 */
const ImportTransactions = () => {
  const [detectedTransactions, setDetectedTransactions] = useState<Transaction[]>([]);
  const { addTransactions } = useTransactions();
  const { toast } = useToast();
  const navigate = useNavigate();

  console.log("[ImportTransactions] Page initialized");

  /**
   * Handles detected transactions from the SmartPaste component.
   * Calculates matching statistics and navigates to the edit page.
   */
  const handleTransactionsDetected = (
    transactions: Transaction[], 
    rawMessage?: string, 
    senderHint?: string, 
    confidence?: number, 
    shouldTrain?: boolean,
    matchOrigin?: "template" | "structure" | "ml" | "fallback"
  ) => {
    console.log("[ImportTransactions] Transactions detected", { 
      count: transactions.length, 
      rawMessageLength: rawMessage?.length, 
      senderHint, 
      confidence, 
      shouldTrain,
      matchOrigin 
    });
    
    const entries = learningEngineService.getLearnedEntries();
    console.log("[ImportTransactions] Retrieved learned entries", { count: entries.length });
  
    // Calculate matchedCount manually
    const matchedCount = entries.filter(entry => {
      return (
        Math.abs(entry.confirmedFields.amount - (transactions[0]?.amount || 0)) < 0.01 &&
        entry.confirmedFields.category === transactions[0]?.category &&
        entry.confirmedFields.type === transactions[0]?.type
      );
    }).length;

    console.log("[ImportTransactions] Match statistics", { 
      matchedCount, 
      totalTemplates: entries.length 
    });
  
    console.log("[ImportTransactions] Navigate to edit with parameters:", { 
      shouldTrain, 
      matchOrigin,
      transaction: transactions[0]
    });
    
    // Navigate to edit with all info
    navigate('/edit-transaction', {
      state: {
        transaction: transactions[0],
        rawMessage,
        senderHint,
        confidence,
        matchedCount,
        totalTemplates: entries.length,
        isSuggested: true,
        shouldTrain,
        matchOrigin
      }
    });
  };
  
  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full px-4 sm:px-6 md:px-8 max-w-full space-y-6 mt-4 py-6"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => {
              console.log("[ImportTransactions] Navigating back");
              navigate(-1);
            }}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Import Transactions</h1>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Import Transactions</CardTitle>
            <CardDescription>
              Import your transactions from SMS, Telegram, or by pasting bank messages
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="smart-paste" className="w-full" onValueChange={(value) => {
              console.log("[ImportTransactions] Tab changed to:", value);
            }}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="smart-paste">Smart Paste</TabsTrigger>
                <TabsTrigger value="telegram">Telegram Bot</TabsTrigger>
              </TabsList>
              
              <TabsContent value="smart-paste" className="mt-4">
                <SmartPaste onTransactionsDetected={handleTransactionsDetected} />
              </TabsContent>
              
              <TabsContent value="telegram" className="mt-4">
                <TelegramBotSetup />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
    </Layout>
  );
};

export default ImportTransactions;
