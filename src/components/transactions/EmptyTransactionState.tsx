
import React from 'react';
import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/i18n/LanguageContext';

interface EmptyTransactionStateProps {
  hasTransactions: boolean;
  hasFilters: boolean;
  onAddTransaction: () => void;
  onClearFilters: () => void;
}

const EmptyTransactionState: React.FC<EmptyTransactionStateProps> = ({
  hasTransactions,
  hasFilters,
  onAddTransaction,
  onClearFilters
}) => {
  const { t } = useLanguage();
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="text-center py-12"
    >
      <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
        <Calendar className="text-muted-foreground" size={24} />
      </div>
      <h3 className="text-lg font-medium">{t('transactions.noFound')}</h3>
      <p className="text-muted-foreground mt-1">
        {hasTransactions === false
          ? t('empty.noTransactionsYet')
          : t('empty.noMatchingFilters')}
      </p>
      {hasTransactions === false && (
        <Button className="mt-4" onClick={onAddTransaction}>
          {t('empty.addFirstTransaction')}
        </Button>
      )}
      {hasTransactions && hasFilters && (
        <Button variant="outline" className="mt-4" onClick={onClearFilters}>
          {t('empty.clearFilters')}
        </Button>
      )}
    </motion.div>
  );
};

export default EmptyTransactionState;
