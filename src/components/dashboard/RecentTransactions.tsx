import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Plus, MessageSquare, ArrowRight } from 'lucide-react';
import TransactionCard from '@/components/transactions/TransactionCard';
import { Transaction } from '@/types/transaction';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/i18n/LanguageContext';

interface RecentTransactionsProps {
  filter: 'all' | 'income' | 'expense';
  setFilter: (filter: 'all' | 'income' | 'expense') => void;
  transactions: Transaction[];
  setIsAddingExpense: (value: boolean) => void;
}

const RecentTransactions = ({ filter, setFilter, transactions, setIsAddingExpense }: RecentTransactionsProps) => {
  const { t } = useLanguage();

  const filteredTransactions = transactions
    .filter(tx => {
      if (filter === 'all') return true;
      return filter === 'income' ? tx.amount > 0 : tx.amount < 0;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, x: -10 }, visible: { opacity: 1, x: 0 } };

  return (
    <Card className="border shadow-sm">
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">{t('recentTx.title')}</h2>
          <div className="flex items-center gap-2">
            <Tabs value={filter} onValueChange={(v) => setFilter(v as 'all' | 'income' | 'expense')}>
              <TabsList className="h-7 bg-muted/50">
                <TabsTrigger value="all" className="text-xs px-2.5 h-6">{t('recentTx.all')}</TabsTrigger>
                <TabsTrigger value="income" className="text-xs px-2.5 h-6">{t('recentTx.income')}</TabsTrigger>
                <TabsTrigger value="expense" className="text-xs px-2.5 h-6">{t('recentTx.expenses')}</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button variant="ghost" size="icon" className="h-7 w-7" title={t('recentTx.refresh')}>
              <RefreshCw size={14} />
            </Button>
          </div>
        </div>
        
        <motion.div className="space-y-2" variants={containerVariants} initial="hidden" animate="visible">
          {filteredTransactions.length > 0 ? (
            filteredTransactions.map((transaction, idx) => (
              <motion.div key={transaction.id || idx} variants={itemVariants}>
                <TransactionCard transaction={transaction} showActions={false} />
              </motion.div>
            ))
          ) : (
            <div className="text-center py-6 border rounded-lg flex flex-col items-center">
              <p className="text-muted-foreground mb-2 text-sm">{t('recentTx.noFound')}</p>
              <div className="flex gap-2">
                <Button size="sm" asChild>
                  <Link to="/process-sms">
                    <MessageSquare className="ltr:mr-1 rtl:ml-1" size={14} />
                    {t('recentTx.importSms')}
                  </Link>
                </Button>
                <Button size="sm" variant="outline" onClick={() => setIsAddingExpense(true)}>
                  <Plus className="ltr:mr-1 rtl:ml-1" size={14} />
                  {t('recentTx.addManually')}
                </Button>
              </div>
            </div>
          )}
          {filteredTransactions.length > 0 && (
            <div className="mt-3">
              <Button variant="outline" size="sm" className="w-full group" asChild>
                <Link to="/transactions" className="flex items-center justify-center">
                  {t('recentTx.viewAll')}
                  <ArrowRight size={14} className="ltr:ml-1 rtl:mr-1 transition-transform duration-200 group-hover:ltr:translate-x-1 group-hover:rtl:-translate-x-1" />
                </Link>
              </Button>
            </div>
          )}
        </motion.div>
      </CardContent>
    </Card>
  );
};

export default RecentTransactions;
