import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface FormErrorSummaryProps {
  form: UseFormReturn<any>;
  className?: string;
}

const FormErrorSummary: React.FC<FormErrorSummaryProps> = ({
  form,
  className
}) => {
  const errors = form.formState.errors;
  const errorEntries = Object.entries(errors);

  if (errorEntries.length === 0) return null;

  const scrollToField = (fieldName: string) => {
    const element = document.querySelector(`[name="${fieldName}"]`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      (element as HTMLElement).focus();
    }
  };

  return (
    <Alert variant="destructive" className={className}>
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        <div className="space-y-2">
          <p className="font-medium">Please fix the following errors:</p>
          <ul className="space-y-1">
            {errorEntries.map(([fieldName, error]) => (
              <li key={fieldName}>
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-destructive-foreground underline"
                  onClick={() => scrollToField(fieldName)}
                >
                  {fieldName}: {(error as any)?.message || 'Invalid value'}
                </Button>
              </li>
            ))}
          </ul>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default FormErrorSummary;