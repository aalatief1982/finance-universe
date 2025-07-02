
import React from 'react';
import { XCircle, Lamp } from 'lucide-react';

interface NoTransactionMessageProps {
  show: boolean;
  /**
   * Optional message to display inside the placeholder. Defaults to
   * "No transaction detected." when not provided.
   */
  message?: string;
  /** Whether a template match was found */
  matched?: boolean;
}

const NoTransactionMessage: React.FC<NoTransactionMessageProps> = ({ show, message, matched }) => {
  if (!show) return null;

  const Icon = matched ? Lamp : XCircle;
  const classes = matched
    ? 'flex items-center gap-1 border rounded-md p-4 bg-green-50 border-green-200 text-green-700'
    : 'text-muted-foreground flex items-center gap-1 border rounded-md p-4 bg-muted/50';

  return (
    <div className={classes}>
      <Icon className="h-4 w-4" />
      {message || 'No transaction detected.'}
    </div>
  );
};

export default NoTransactionMessage;
