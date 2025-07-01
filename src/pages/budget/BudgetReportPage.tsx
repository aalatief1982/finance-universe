import React from 'react';
import Layout from '@/components/Layout';
import PageHeader from '@/components/layout/PageHeader';
import { useTransactions } from '@/context/TransactionContext';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, LineChart, Line, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { budgetService } from '@/services/BudgetService';
import { accountService } from '@/services/AccountService';
import { transactionService } from '@/services/TransactionService';
import { Budget } from '@/models/budget';
import { formatCurrency } from '@/utils/format-utils';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const BudgetReportPage = () => {
  const { transactions } = useTransactions();
  const budgets = React.useMemo(() => budgetService.getBudgets(), []);
  const accounts = React.useMemo(() => accountService.getAccounts(), []);
  const categories = React.useMemo(() => transactionService.getCategories(), []);

  const getTargetName = (b: Budget) => {
    const all = [...accounts, ...categories];
    const t = all.find((a: any) => a.id === b.targetId);
    return t ? (t as any).name : b.targetId;
  };

  const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
  const totalSpent = transactions.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  const pieData = [
    { name: 'Budgeted', value: totalBudget },
    { name: 'Spent', value: totalSpent }
  ];

  const overBudget = budgets.map(b => {
    const spent = transactions
      .filter(t => (b.scope === 'account' ? t.fromAccount === getTargetName(b) : t.category === getTargetName(b)))
      .reduce((s, t) => s + Math.abs(t.amount), 0);
    return { name: getTargetName(b), value: Math.max(0, spent - b.amount) };
  }).filter(d => d.value > 0);

  const trendData = budgets.map(b => {
    const spent = transactions
      .filter(t => t.category === getTargetName(b))
      .reduce((s, t) => s + Math.abs(t.amount), 0);
    return { name: getTargetName(b), budget: b.amount, spent };
  });

  return (
    <Layout showBack>
      <div className="container px-1 space-y-4">
        <PageHeader title="Budget vs Actual" />
        <div className="bg-card p-4 rounded-xl">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v:number)=>formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-card p-4 rounded-xl">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={overBudget} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={v=>v.toString()} />
                <Bar dataKey="value" fill="#ff4d4f" />
                <Tooltip formatter={(v:number)=>formatCurrency(v)} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-card p-4 rounded-xl">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={v=>v.toString()} />
                <Tooltip formatter={(v:number)=>formatCurrency(v)} />
                <Line type="monotone" dataKey="budget" stroke="#8884d8" />
                <Line type="monotone" dataKey="spent" stroke="#82ca9d" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default BudgetReportPage;
