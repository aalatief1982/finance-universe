
import React from 'react';
import Layout from '@/components/Layout';
import DashboardStats from '@/components/DashboardStats';
import ExpenseChart from '@/components/ExpenseChart';
import { useTransactions } from '@/context/TransactionContext';
import { Transaction } from '@/types/transaction';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const Dashboard = () => {
  const { transactions, addTransaction } = useTransactions();
  const navigate = useNavigate();

  const handleAddTransaction = () => {
    navigate('/edit-transaction');
  };

  // For demo purposes - adds a sample transaction
  const handleAddSampleTransaction = () => {
    const sampleTransaction: Transaction = {
      id: uuidv4(),
      title: 'Sample Transaction',
      amount: -25.99,
      category: 'Food',
      date: new Date().toISOString().split('T')[0],
      type: 'expense',
      notes: 'Sample transaction for testing',
      source: 'manual',
      fromAccount: 'Cash'
    };
    
    addTransaction(sampleTransaction);
  };
  
  // Calculate summary statistics
  const summary = transactions.reduce(
    (acc, transaction) => {
      if (transaction.amount > 0) {
        acc.income += transaction.amount;
      } else {
        acc.expenses += Math.abs(transaction.amount);
      }
      acc.balance += transaction.amount;
      return acc;
    },
    { income: 0, expenses: 0, balance: 0 }
  );

  // Generate chart data
  const categoryData = transactions
    .filter(t => t.amount < 0)
    .reduce((acc, transaction) => {
      const { category, amount } = transaction;
      if (!acc[category]) {
        acc[category] = 0;
      }
      acc[category] += Math.abs(amount);
      return acc;
    }, {} as Record<string, number>);

  const timelineData = transactions
    .filter(t => t.amount < 0)
    .reduce((acc, transaction) => {
      const date = transaction.date.slice(0, 10); // Get YYYY-MM-DD
      if (!acc[date]) {
        acc[date] = 0;
      }
      acc[date] += Math.abs(transaction.amount);
      return acc;
    }, {} as Record<string, number>);

  // Format data for charts
  const expensesByCategory = Object.entries(categoryData)
    .map(([name, value]) => ({ name, value }));

  const expensesByDate = Object.entries(timelineData)
    .map(([date, amount]) => ({ date, amount }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  return (
    <Layout>
      <div className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <Button 
            onClick={handleAddTransaction}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" /> Add Transaction
          </Button>
        </div>
        
        <DashboardStats 
          income={summary.income} 
          expenses={summary.expenses} 
          balance={summary.balance} 
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Expense Breakdown</h2>
            <ExpenseChart 
              expensesByCategory={expensesByCategory}
              expensesByDate={expensesByDate}
            />
          </div>
          
          <div className="bg-card p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Recent Transactions</h2>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/transactions')}
              >
                View All
              </Button>
            </div>
            
            {transactions.length > 0 ? (
              <div className="space-y-4">
                {transactions.slice(0, 5).map((transaction) => (
                  <div 
                    key={transaction.id}
                    className="flex justify-between items-center p-3 bg-secondary/50 rounded-md"
                  >
                    <div>
                      <p className="font-medium">{transaction.title}</p>
                      <p className="text-sm text-muted-foreground">{transaction.category} • {transaction.date}</p>
                    </div>
                    <p className={transaction.amount < 0 ? "text-red-500" : "text-green-500"}>
                      {transaction.amount < 0 ? "-" : "+"}${Math.abs(transaction.amount).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground mb-4">No transactions yet</p>
                <Button onClick={handleAddSampleTransaction}>Add Sample Transactions</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
