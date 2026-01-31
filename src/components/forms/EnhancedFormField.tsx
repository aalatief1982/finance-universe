/**
 * @file EnhancedFormField.tsx
 * @description UI component for EnhancedFormField.
 *
 * @module components/forms/EnhancedFormField
 *
 * @responsibilities
 * 1. Render UI for the feature area
 * 2. Accept props and emit user interactions
 * 3. Compose shared subcomponents where needed
 *
 * @review-tags
 * - @ui: visual/layout behavior
 *
 * @review-checklist
 * - [ ] Props have sensible defaults
 * - [ ] Component renders without crashing
 */
import React, { ReactNode } from 'react';
import { FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { UseFormReturn } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface EnhancedFormFieldProps {
  form: UseFormReturn<any>;
  name: string;
  label?: string;
  description?: string;
  required?: boolean;
  showValidationState?: boolean;
  className?: string;
  children: (field: any, fieldState: 'default' | 'error' | 'success' | 'loading') => ReactNode;
}

const EnhancedFormField: React.FC<EnhancedFormFieldProps> = ({
  form,
  name,
  label,
  description,
  required = false,
  showValidationState = true,
  className,
  children
}) => {
  const fieldError = form.formState.errors[name];
  const fieldValue = form.watch(name);
  const isLoading = form.formState.isSubmitting;
  
  const getFieldState = (): 'default' | 'error' | 'success' | 'loading' => {
    if (isLoading) return 'loading';
    if (fieldError) return 'error';
    if (fieldValue && !fieldError) return 'success';
    return 'default';
  };

  const fieldState = getFieldState();

  const StateIcon = () => {
    if (!showValidationState) return null;
    
    switch (fieldState) {
      case 'success':
        return <CheckCircle size={16} className="text-success absolute right-3 top-1/2 -translate-y-1/2" />;
      case 'error':
        return <AlertCircle size={16} className="text-destructive absolute right-3 top-1/2 -translate-y-1/2" />;
      case 'loading':
        return <Loader2 size={16} className="text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 animate-spin" />;
      default:
        return null;
    }
  };

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn("space-y-1", className)}>
          {label && (
            <FormLabel className={cn(
              "text-sm font-medium",
              required && "after:content-['*'] after:text-destructive after:ml-1"
            )}>
              {label}
            </FormLabel>
          )}
          <FormControl>
            <div className="relative">
              {children(field, fieldState)}
              <StateIcon />
            </div>
          </FormControl>
          {description && (
            <FormDescription className="text-xs text-muted-foreground">
              {description}
            </FormDescription>
          )}
          <FormMessage className="text-xs" />
        </FormItem>
      )}
    />
  );
};

export default EnhancedFormField;