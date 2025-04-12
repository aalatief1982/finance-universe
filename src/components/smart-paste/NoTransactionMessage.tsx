
import React from 'react';
import { XCircle } from 'lucide-react';

interface NoTransactionMessageProps {
  show: boolean;
}

const NoTransactionMessage: React.FC<NoTransactionMessageProps> = ({ show }) => {
  if (!show) return null;
  
  return (
    <div className="text-muted-foreground flex items-center gap-1 border rounded-md p-4 bg-muted/50">
      <XCircle className="h-4 w-4" />
      No transaction detected.
    </div>
  );
};

export default NoTransactionMessage;
