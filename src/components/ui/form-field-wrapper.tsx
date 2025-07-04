import React from 'react';
import { cn } from '@/lib/utils';
import { Label } from './label';

interface FormFieldWrapperProps {
  children: React.ReactNode;
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  fieldId?: string;
}

const FormFieldWrapper: React.FC<FormFieldWrapperProps> = ({
  children,
  label,
  error,
  hint,
  required = false,
  className,
  fieldId
}) => {
  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label 
          htmlFor={fieldId}
          className={cn(
            'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
            required && "after:content-['*'] after:ml-1 after:text-destructive"
          )}
        >
          {label}
        </Label>
      )}
      
      <div className="relative">
        {children}
      </div>
      
      {hint && !error && (
        <p className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      
      {error && (
        <p className="text-xs text-destructive animate-fade-in">
          {error}
        </p>
      )}
    </div>
  );
};

export { FormFieldWrapper };