
import React from 'react';
import { XCircle } from 'lucide-react';

interface NoTransactionMessageProps {
  show: boolean;
}

/**
 * Displays a message when no transaction could be detected from the input.
 * Only renders when explicitly set to show.
 */
const NoTransactionMessage: React.FC<NoTransactionMessageProps> = ({ show }) => {
  console.log("[NoTransactionMessage] Rendering with show:", show);
  
  if (!show) return null;
  
  return (
    <div className="text-muted-foreground flex items-center gap-1 border rounded-md p-4 bg-muted/50">
      <XCircle className="h-4 w-4" />
      <span>No transaction detected.</span>
    </div>
  );
};

export default NoTransactionMessage;
