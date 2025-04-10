
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Transaction } from '@/types/transaction';
import { useTransactions } from '@/context/TransactionContext';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import TransactionEditForm from '@/components/TransactionEditForm';

const EditTransaction = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { addTransactions, updateTransaction } = useTransactions();
  const { toast } = useToast();
  
  // Get transaction from location state or use empty transaction for new entry
  const transaction = location.state?.transaction as Transaction | undefined;
  const isNewTransaction = !transaction;
  
  const handleSave = (editedTransaction: Transaction) => {
    if (isNewTransaction) {
      addTransactions([editedTransaction]);
      toast({
        title: "Transaction created",
        description: "Your transaction has been successfully created",
      });
    } else {
      updateTransaction(editedTransaction);
      toast({
        title: "Transaction updated",
        description: "Your transaction has been successfully updated",
      });
    }
    
    // Navigate back to previous screen
    navigate(-1);
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
          <h1 className="text-2xl font-bold">
            {isNewTransaction ? "Add Transaction" : "Edit Transaction"}
          </h1>
        </div>
        
        <Card className="max-h-[calc(100vh-180px)]">
          <CardHeader>
            <CardTitle>
              {isNewTransaction ? "Create a new transaction" : "Edit transaction details"}
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-y-auto max-h-[calc(100vh-240px)] pb-6">
            <TransactionEditForm 
              transaction={transaction} 
              onSave={handleSave} 
            />
          </CardContent>
        </Card>
      </motion.div>
    </Layout>
  );
};

export default EditTransaction;
