
import React from 'react';
import { XCircle } from 'lucide-react';

interface NoTransactionMessageProps {
  show: boolean;
  hint?: string;
}

const NoTransactionMessage: React.FC<NoTransactionMessageProps> = ({ show, hint }) => {
  if (!show && !hint) return null;

  return (
    <div className="text-muted-foreground flex flex-col gap-1 border rounded-md p-4 bg-muted/50">
      {show && (
        <div className="flex items-center gap-1">
          <XCircle className="h-4 w-4" />
          No transaction detected.
        </div>
      )}
      {hint && <p className="text-xs">{hint}</p>}
    </div>
  );
};

export default NoTransactionMessage;
