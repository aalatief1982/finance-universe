
import React, { useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Transaction } from '@/types/transaction';
import { useTransactions } from '@/context/TransactionContext';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import TransactionEditForm from '@/components/TransactionEditForm';
import { v4 as uuidv4 } from 'uuid';
import { storeTransaction } from '@/utils/storage-utils';

const EditTransaction = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const { addTransaction, updateTransaction, transactions } = useTransactions();
  const { toast } = useToast();
  
  // Try to get transaction from location state first, then from URL params if available
  let transaction = location.state?.transaction as Transaction | undefined;
  
  // If we have an ID in the URL params, try to find the transaction by ID
  if (!transaction && params.id) {
    transaction = transactions.find(t => t.id === params.id);
  }
  
  const isNewTransaction = !transaction;
  
  // If we're editing a transaction but couldn't find it, redirect to dashboard
  useEffect(() => {
    if (params.id && !transaction) {
      toast({
        title: "Transaction not found",
        description: "The transaction you're trying to edit doesn't exist",
        variant: "destructive"
      });
      navigate('/dashboard');
    }
  }, [params.id, transaction, navigate, toast]);
  
  const handleSave = (editedTransaction: Transaction) => {
    // Ensure we have an id for new transactions
    if (isNewTransaction) {
      const newTransaction = {
        ...editedTransaction,
        id: editedTransaction.id || uuidv4(), // Use the existing ID or generate a new one
        source: editedTransaction.source || 'manual' // Set source to manual if not specified
      };
      
      // Add to context
      addTransaction(newTransaction);
      
      // Save to local storage
      storeTransaction(newTransaction);
      
      toast({
        title: "Transaction created",
        description: "Your transaction has been successfully created",
      });
    } else {
      // Update in context
      updateTransaction(editedTransaction);
      
      // Update in local storage
      storeTransaction(editedTransaction);
      
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
