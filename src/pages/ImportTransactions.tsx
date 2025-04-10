
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

const ImportTransactions = () => {
  const [detectedTransactions, setDetectedTransactions] = useState<Transaction[]>([]);
  const { addTransactions } = useTransactions();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleTransactionsDetected = (transactions: Transaction[], rawMessage?: string, senderHint?: string) => {
    setDetectedTransactions(transactions);
    
    if (transactions.length === 1 && rawMessage) {
      // For a single transaction with raw message, navigate to edit with context
      navigate('/edit-transaction', { 
        state: { 
          transaction: transactions[0],
          rawMessage,
          senderHint
        } 
      });
      return;
    }
    
    // Add transactions to the store
    addTransactions(transactions);
    
    toast({
      title: "Transactions imported",
      description: `Successfully imported ${transactions.length} transaction(s)`,
    });
    
    // Optional: Navigate back to dashboard after successful import
    setTimeout(() => {
      navigate('/dashboard');
    }, 1500);
  };

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="container max-w-4xl mx-auto py-6 space-y-6"
      >
        <div className="flex items-center space-x-4">
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
