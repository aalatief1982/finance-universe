
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

const ImportTransactions = () => {
  const [detectedTransactions, setDetectedTransactions] = useState<Transaction[]>([]);
  const { addTransactions } = useTransactions();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleTransactionsDetected = (
    transactions: Transaction[], 
    rawMessage?: string, 
    senderHint?: string, 
    confidence?: number, 
    shouldTrain?: boolean,
    matchOrigin?: "template" | "structure" | "ml" | "fallback"
  ) => {
    const entries = learningEngineService.getLearnedEntries();
  
    // Calculate matchedCount manually
    const matchedCount = entries.filter(entry => {
      return (
        Math.abs(entry.confirmedFields.amount - (transactions[0]?.amount || 0)) < 0.01 &&
        entry.confirmedFields.category === transactions[0]?.category &&
        entry.confirmedFields.type === transactions[0]?.type
      );
    }).length;
  
    console.log("Navigate to edit with shouldTrain:", shouldTrain, "matchOrigin:", matchOrigin);
    
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
            onClick={() => navigate(-1)}
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
            <Tabs defaultValue="smart-paste" className="w-full">
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
