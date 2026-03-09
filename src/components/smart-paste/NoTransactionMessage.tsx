
import React from 'react';
import { XCircle, Lamp } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';

interface NoTransactionMessageProps {
  show: boolean;
  message?: string;
  matched?: boolean;
}

const NoTransactionMessage: React.FC<NoTransactionMessageProps> = ({ show, message, matched }) => {
  const { t } = useLanguage();
  if (!show) return null;

  const Icon = matched ? Lamp : XCircle;
  const classes = matched
    ? 'flex items-center gap-1 border rounded-md p-4 bg-green-50 border-green-200 text-green-700'
    : 'text-muted-foreground flex items-center gap-1 border rounded-md p-4 bg-muted/50';

  return (
    <div className={classes}>
      <Icon className="h-4 w-4" />
      {message || t('smartEntry.noTransactionDefault')}
    </div>
  );
};

export default NoTransactionMessage;
