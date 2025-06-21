
import React from 'react';
import { XCircle } from 'lucide-react';

interface NoTransactionMessageProps {
  show: boolean;
  /**
   * Optional message to display inside the placeholder. Defaults to
   * "No transaction detected." when not provided.
   */
  message?: string;
}

const NoTransactionMessage: React.FC<NoTransactionMessageProps> = ({ show, message }) => {
  if (!show) return null;
  
  return (
    <div className="text-muted-foreground flex items-center gap-1 border rounded-md p-4 bg-muted/50">
      <XCircle className="h-4 w-4" />
      {message || 'No transaction detected.'}
    </div>
  );
};

export default NoTransactionMessage;
