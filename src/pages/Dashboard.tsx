
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import { Dialog } from '@/components/ui/dialog';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/context/UserContext';
import { Transaction } from '@/types/transaction';
import { useTransactions } from '@/context/TransactionContext';
import { smsPermissionService } from '@/services/SmsPermissionService';
import SmsPermissionRequest from '@/components/SmsPermissionRequest';

// Import the component files
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import MobileSmsButton from '@/components/dashboard/MobileSmsButton';
import DashboardContent from '@/components/dashboard/DashboardContent';
import TransactionDialog from '@/components/dashboard/TransactionDialog';

const Dashboard = () => {
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const { toast } = useToast();
  const { user, updateUser } = useUser();
  const { transactions, addTransaction, isLoading } = useTransactions();
  const [canReadSms, setCanReadSms] = useState(false);

  // Check if SMS permissions are granted on component mount
  useEffect(() => {
    const checkSmsPermission = () => {
      const hasPermission = smsPermissionService.hasPermission();
      setCanReadSms(hasPermission);
      
      // If we're in a native environment and permission isn't granted and user hasn't been asked yet
      if (smsPermissionService.isNativeEnvironment() && 
          !hasPermission && 
          user?.smsPermissionGranted === undefined) {
        setShowPermissionDialog(true);
      }
    };
    
    checkSmsPermission();
  }, [user]);

  const handleAddTransaction = (formData: any) => {
    try {
      const newTransaction: Omit<Transaction, 'id'> = {
        title: formData.title,
        amount: formData.amount,
        category: formData.category,
        date: formData.date,
        type: formData.amount >= 0 ? 'income' : 'expense',
        notes: formData.notes || '',
      };

      addTransaction(newTransaction);
      setIsAddingExpense(false);
      
      toast({
        title: "Transaction added",
        description: `${newTransaction.title} has been added successfully.`,
      });
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast({
        title: "Error",
        description: "Failed to add transaction. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRequestSmsPermission = async () => {
    const granted = await smsPermissionService.requestPermission();
    
    if (granted) {
      setCanReadSms(true);
      updateUser({ smsPermissionGranted: true });
      toast({
        title: "Permission granted",
        description: "You can now import transactions from SMS",
      });
    } else {
      updateUser({ smsPermissionGranted: false });
      toast({
        title: "Permission denied",
        description: "You'll need to manually add transactions",
        variant: "destructive",
      });
    }
    
    setShowPermissionDialog(false);
  };
  
  const handlePermissionDenied = () => {
    updateUser({ smsPermissionGranted: false });
    setShowPermissionDialog(false);
  };

  return (
    <>
      <Layout>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <DashboardHeader 
            user={user} 
            setIsAddingExpense={setIsAddingExpense}
          />
          
          {/* Only show SMS button if in mobile environment */}
          {smsPermissionService.isNativeEnvironment() && (
            canReadSms ? (
              <MobileSmsButton />
            ) : (
              <div className="sm:hidden mb-4">
                <div className="bg-primary/5 rounded-lg p-3 border border-primary/20">
                  <p className="text-sm mb-2">Enable automatic expense tracking through SMS</p>
                  <button 
                    onClick={handleRequestSmsPermission} 
                    className="text-xs bg-primary text-white px-3 py-1.5 rounded-md"
                  >
                    Grant SMS Permission
                  </button>
                </div>
              </div>
            )
          )}
          
          <DashboardContent 
            transactions={transactions}
            filter={filter}
            setFilter={setFilter}
            setIsAddingExpense={setIsAddingExpense}
            isLoading={isLoading}
          />
        </motion.div>
      </Layout>

      <Dialog open={isAddingExpense} onOpenChange={setIsAddingExpense}>
        <TransactionDialog
          isOpen={isAddingExpense}
          onClose={() => setIsAddingExpense(false)}
          onSubmit={handleAddTransaction}
        />
      </Dialog>
      
      {/* SMS Permission Dialog */}
      <Dialog open={showPermissionDialog} onOpenChange={setShowPermissionDialog}>
        <SmsPermissionRequest
          onGranted={handleRequestSmsPermission}
          onDenied={handlePermissionDenied}
        />
      </Dialog>
    </>
  );
};

export default Dashboard;
