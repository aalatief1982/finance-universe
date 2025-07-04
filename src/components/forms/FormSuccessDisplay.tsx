import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle } from 'lucide-react';

interface FormSuccessDisplayProps {
  message: string;
}

const FormSuccessDisplay: React.FC<FormSuccessDisplayProps> = ({ message }) => {
  return (
    <Alert className="mb-4 border-success bg-success/10">
      <CheckCircle className="h-4 w-4 text-success" />
      <AlertDescription className="text-success">{message}</AlertDescription>
    </Alert>
  );
};

export default FormSuccessDisplay;