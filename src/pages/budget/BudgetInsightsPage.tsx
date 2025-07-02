import React from 'react';
import Layout from '@/components/Layout';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useTransactions } from '@/context/TransactionContext';
import { budgetService } from '@/services/BudgetService';
import { accountService } from '@/services/AccountService';
import { transactionService } from '@/services/TransactionService';
import { Budget } from '@/models/budget';

const BudgetInsightsPage = () => {
  const { transactions } = useTransactions();
  const budgets = React.useMemo(() => budgetService.getBudgets(), []);
  const accounts = React.useMemo(() => accountService.getAccounts(), []);
  const categories = React.useMemo(() => transactionService.getCategories(), []);

  const getTargetName = (b: Budget) => {
    const all = [...accounts, ...categories];
    const t = all.find((a: any) => a.id === b.targetId);
    return t ? (t as any).name : b.targetId;
  };

  const insights: { id: string; text: string }[] = [];

  budgets.forEach(b => {
    const spent = transactions
      .filter(t => (b.scope === 'account' ? t.fromAccount === getTargetName(b) : t.category === getTargetName(b)))
      .reduce((s, t) => s + Math.abs(t.amount), 0);
    if (spent > b.amount) {
      insights.push({ id: b.id + 'over', text: `Over budget for ${getTargetName(b)}` });
    } else if (spent < b.amount * 0.1) {
      insights.push({ id: b.id + 'under', text: `${getTargetName(b)} under 10% of budget` });
    }
  });

  if (!insights.length) {
    insights.push({ id: 'none', text: 'No insights available yet.' });
  }

  return (
    <Layout showBack>
      <div className="container px-1 space-y-3">
        {insights.map(i => (
          <Alert key={i.id} className="bg-card">
            <AlertTitle>Insight</AlertTitle>
            <AlertDescription>{i.text}</AlertDescription>
          </Alert>
        ))}
      </div>
    </Layout>
  );
};

export default BudgetInsightsPage;
