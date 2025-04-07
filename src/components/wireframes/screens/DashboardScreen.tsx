
import React, { useState } from 'react';
import WireframeContainer from '../WireframeContainer';
import WireframeHeader from '../WireframeHeader';
import { useTransactions } from '@/context/TransactionContext';
import { useUser } from '@/context/UserContext';
import BalanceCard from './dashboard/BalanceCard';
import TransactionFilters from './dashboard/TransactionFilters';
import ExpenseChart from './dashboard/ExpenseChart';
import TransactionsSection from './dashboard/TransactionsSection';
import ActionButtons from './dashboard/ActionButtons';

interface UserData {
  name?: string;
  email?: string;
  phone?: string;
  smsProviders?: string[];
  smsStartDate?: string;
}

interface DashboardScreenProps {
  onAddTransaction: () => void;
  onReports: () => void;
  onImportSms: () => void;
  onSettings: () => void;
  userData?: UserData;
}

const DashboardScreen = ({ 
  onAddTransaction, 
  onReports, 
  onImportSms, 
  onSettings, 
  userData 
}: DashboardScreenProps) => {
  const [activeTab, setActiveTab] = useState('all');
  const [period, setPeriod] = useState('month');
  const [currency, setCurrency] = useState('USD'); // Default currency
  const { transactions, getTransactionsSummary } = useTransactions();
  const { user } = useUser();
  
  // Filter transactions based on activeTab
  const filteredTransactions = transactions.filter(tx => {
    if (activeTab === 'all') return true;
    return activeTab === 'income' ? tx.amount > 0 : tx.amount < 0;
  }).slice(0, 5); // Just show the most recent 5
  
  // Calculate summary statistics
  const summary = getTransactionsSummary();
  const totalIncome = summary.totalIncome || 0;
  const totalExpense = summary.totalExpense || 0;
  const balance = summary.netAmount || 0;
  
  // Format currency based on selection
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  return (
    <WireframeContainer>
      <WireframeHeader title={`${userData?.name ? `Hi, ${userData.name.split(' ')[0]}` : 'Dashboard'}`} />
      
      <div className="mb-4">
        <BalanceCard 
          balance={balance}
          income={totalIncome}
          expenses={totalExpense}
          currency={currency}
          setCurrency={setCurrency}
        />
        
        <TransactionFilters
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          period={period}
          setPeriod={setPeriod}
        />
        
        <ExpenseChart />
        
        <TransactionsSection
          transactions={filteredTransactions}
          onAddTransaction={onAddTransaction}
          onImportSms={onImportSms}
          currency={currency}
          formatCurrency={formatCurrency}
        />
      </div>
      
      <ActionButtons
        onAddTransaction={onAddTransaction}
        onReports={onReports}
        onImportSms={onImportSms}
        onSettings={onSettings}
      />
    </WireframeContainer>
  );
};

export default DashboardScreen;
