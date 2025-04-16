
import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ErrorAlertProps {
  error: string | null;
}

/**
 * Displays error messages related to transaction detection.
 * Only renders when an error message is provided.
 */
const ErrorAlert: React.FC<ErrorAlertProps> = ({ error }) => {
  console.log("[ErrorAlert] Rendering with error:", error);
  
  if (!error) return null;
  
  return (
    <Alert variant="destructive" className="bg-amber-50 border-amber-200">
      <AlertTriangle className="h-4 w-4 text-destructive" />
      <AlertDescription className="text-destructive-foreground">{error}</AlertDescription>
    </Alert>
  );
};

export default ErrorAlert;
