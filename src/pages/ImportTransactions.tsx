
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, PlusCircle, FileText } from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import SmartPaste from '@/components/SmartPaste';
import TelegramBotSetup from '@/components/TelegramBotSetup';
import { Transaction } from '@/types/transaction';
import { transactionService } from '@/services/TransactionService';

const ImportTransactions = () => {
  const [activeTab, setActiveTab] = useState<string>('smart-paste');
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleTransactionsDetected = (transactions: Transaction[]) => {
    if (transactions.length > 0) {
      // Save detected transactions
      const existingTransactions = transactionService.getAllTransactions();
      transactionService.saveTransactions([...transactions, ...existingTransactions]);
      
      toast({
        title: "Transactions imported",
        description: `Successfully imported ${transactions.length} transaction(s)`,
      });
      
      // Navigate to dashboard after short delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    }
  };

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md mx-auto space-y-6"
      >
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/dashboard')}
            className="mr-2"
          >
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-2xl font-bold">Import Transactions</h1>
        </div>
        
        <Tabs defaultValue="smart-paste" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="smart-paste" className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              Smart Paste
            </TabsTrigger>
            <TabsTrigger value="telegram" className="flex items-center gap-1">
              <PlusCircle className="h-4 w-4" />
              Telegram Bot
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="smart-paste" className="space-y-4 mt-4">
            <SmartPaste onTransactionsDetected={handleTransactionsDetected} />
          </TabsContent>
          
          <TabsContent value="telegram" className="space-y-4 mt-4">
            <TelegramBotSetup 
              botUsername="FinanceExpenseBot"
              onConnect={() => {
                toast({
                  title: "Connected to Telegram bot",
                  description: "You can now forward bank messages to the bot"
                });
              }}
            />
          </TabsContent>
        </Tabs>
        
        <Button
          variant="outline"
          className="w-full"
          onClick={() => navigate('/dashboard')}
        >
          Back to Dashboard
        </Button>
      </motion.div>
    </Layout>
  );
};

export default ImportTransactions;
