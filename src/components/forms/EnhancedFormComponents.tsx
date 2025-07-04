import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import BrandMessage from '@/components/branding/BrandMessage';
import { EnhancedButton } from '@/components/ui/enhanced-components';
import { COPY } from '@/components/copy/StandardizedCopy';
import { cn } from '@/lib/utils';

interface EnhancedFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  success?: string;
  help?: string;
  className?: string;
  children: React.ReactNode;
}

export const EnhancedField: React.FC<EnhancedFieldProps> = ({
  label,
  required = false,
  error,
  success,
  help,
  className,
  children
}) => {
  return (
    <div className={cn('space-y-2', className)}>
      <Label className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
        {!required && <span className="text-muted-foreground ml-1">{COPY.FORMS.OPTIONAL_FIELD}</span>}
      </Label>
      
      {children}
      
      {error && (
        <BrandMessage
          type="errorMessages"
          messageKey="validation"
          variant="inline"
          className="text-destructive"
        >
          {error}
        </BrandMessage>
      )}
      
      {success && (
        <BrandMessage
          type="successMessages"
          messageKey="save"
          variant="inline"
          className="text-success"
        >
          {success}
        </BrandMessage>
      )}
      
      {help && !error && !success && (
        <BrandMessage
          type="helpText"
          messageKey="category"
          variant="inline"
        >
          {help}
        </BrandMessage>
      )}
    </div>
  );
};

interface EnhancedInputProps extends React.ComponentProps<typeof Input> {
  label: string;
  required?: boolean;
  error?: string;
  success?: string;
  help?: string;
  isAutoSaving?: boolean;
}

export const EnhancedInput: React.FC<EnhancedInputProps> = ({
  label,
  required = false,
  error,
  success,
  help,
  isAutoSaving = false,
  className,
  ...props
}) => {
  const getState = () => {
    if (error) return 'error';
    if (success) return 'success';
    if (isAutoSaving) return 'loading';
    return 'default';
  };

  return (
    <EnhancedField
      label={label}
      required={required}
      error={error}
      success={success}
      help={help}
    >
      <Input
        state={getState()}
        showStateIcon={!!error || !!success}
        className={cn(
          'transition-all duration-200',
          error && 'border-destructive focus-visible:ring-destructive',
          success && 'border-success focus-visible:ring-success',
          className
        )}
        {...props}
      />
    </EnhancedField>
  );
};

interface EnhancedTextareaProps extends React.ComponentProps<typeof Textarea> {
  label: string;
  required?: boolean;
  error?: string;
  success?: string;
  help?: string;
}

export const EnhancedTextarea: React.FC<EnhancedTextareaProps> = ({
  label,
  required = false,
  error,
  success,
  help,
  className,
  ...props
}) => {
  return (
    <EnhancedField
      label={label}
      required={required}
      error={error}
      success={success}
      help={help}
    >
      <Textarea
        className={cn(
          'transition-all duration-200',
          error && 'border-destructive focus-visible:ring-destructive',
          success && 'border-success focus-visible:ring-success',
          className
        )}
        {...props}
      />
    </EnhancedField>
  );
};

interface EnhancedSelectProps {
  label: string;
  required?: boolean;
  error?: string;
  success?: string;
  help?: string;
  placeholder?: string;
  options: Array<{ value: string; label: string }>;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

export const EnhancedSelect: React.FC<EnhancedSelectProps> = ({
  label,
  required = false,
  error,
  success,
  help,
  placeholder = COPY.FORMS.SELECT_OPTION,
  options,
  value,
  onValueChange,
  className
}) => {
  return (
    <EnhancedField
      label={label}
      required={required}
      error={error}
      success={success}
      help={help}
    >
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className={cn(
          'transition-all duration-200',
          error && 'border-destructive focus-visible:ring-destructive',
          success && 'border-success focus-visible:ring-success',
          className
        )}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </EnhancedField>
  );
};

interface EnhancedFormActionsProps {
  onSubmit?: () => void;
  onCancel?: () => void;
  submitText?: string;
  cancelText?: string;
  isSubmitting?: boolean;
  isSuccess?: boolean;
  className?: string;
}

export const EnhancedFormActions: React.FC<EnhancedFormActionsProps> = ({
  onSubmit,
  onCancel,
  submitText = COPY.BUTTONS.SUBMIT,
  cancelText = COPY.BUTTONS.CANCEL,
  isSubmitting = false,
  isSuccess = false,
  className
}) => {
  return (
    <div className={cn('flex justify-end space-x-2 pt-4', className)}>
      {onCancel && (
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          {cancelText}
        </Button>
      )}
      
      {onSubmit && (
        <EnhancedButton
          type="submit"
          onClick={onSubmit}
          isLoading={isSubmitting}
          isSuccess={isSuccess}
          loadingText={COPY.STATUS.SAVING}
          successText={COPY.STATUS.SAVED}
          animated
        >
          {submitText}
        </EnhancedButton>
      )}
    </div>
  );
};