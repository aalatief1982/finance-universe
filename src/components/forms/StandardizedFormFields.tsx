import React from 'react';
import { Control, FieldPath, FieldValues } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { COPY } from '@/components/copy/StandardizedCopy';
import BrandMessage from '@/components/branding/BrandMessage';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface StandardizedFormFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label?: string;
  description?: string;
  placeholder?: string;
  required?: boolean;
  type?: 'text' | 'email' | 'tel' | 'number' | 'date' | 'password';
  className?: string;
  state?: 'default' | 'loading' | 'success' | 'error';
}

export function StandardizedInputField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  placeholder,
  required = false,
  type = 'text',
  className,
  state = 'default'
}: StandardizedFormFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem className={cn("space-y-1", className)}>
          {label && (
            <FormLabel className={cn(
              "text-sm font-medium text-foreground",
              required && "after:content-['*'] after:text-destructive after:ml-1"
            )}>
              {label}
            </FormLabel>
          )}
          <FormControl>
            <div className="relative">
              <Input
                type={type}
                placeholder={placeholder}
                state={fieldState.error ? 'error' : state}
                showStateIcon={true}
                className={cn(
                  "transition-all duration-200",
                  fieldState.error && "border-destructive focus-visible:ring-destructive"
                )}
                {...field}
              />
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
}

interface StandardizedTextAreaFieldProps<T extends FieldValues> extends StandardizedFormFieldProps<T> {
  rows?: number;
}

export function StandardizedTextAreaField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  placeholder,
  required = false,
  rows = 3,
  className,
  state = 'default'
}: StandardizedTextAreaFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem className={cn("space-y-1", className)}>
          {label && (
            <FormLabel className={cn(
              "text-sm font-medium text-foreground",
              required && "after:content-['*'] after:text-destructive after:ml-1"
            )}>
              {label}
            </FormLabel>
          )}
          <FormControl>
            <Textarea
              placeholder={placeholder}
              rows={rows}
              className={cn(
                "transition-all duration-200",
                fieldState.error && "border-destructive focus-visible:ring-destructive"
              )}
              {...field}
            />
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
}

interface StandardizedSelectFieldProps<T extends FieldValues> extends StandardizedFormFieldProps<T> {
  options: { value: string; label: string }[];
  emptyText?: string;
}

export function StandardizedSelectField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  placeholder,
  required = false,
  options,
  emptyText = COPY.EMPTY_STATES.NO_DATA,
  className,
  state = 'default'
}: StandardizedSelectFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem className={cn("space-y-1", className)}>
          {label && (
            <FormLabel className={cn(
              "text-sm font-medium text-foreground",
              required && "after:content-['*'] after:text-destructive after:ml-1"
            )}>
              {label}
            </FormLabel>
          )}
          <Select onValueChange={field.onChange} defaultValue={field.value}>
            <FormControl>
              <SelectTrigger className={cn(
                "transition-all duration-200",
                fieldState.error && "border-destructive focus-visible:ring-destructive"
              )}>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.length === 0 ? (
                <div className="p-2 text-center text-sm text-muted-foreground">
                  {emptyText}
                </div>
              ) : (
                options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
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
}

interface StandardizedFormSubmitProps {
  isSubmitting: boolean;
  submitText?: string;
  loadingText?: string;
  className?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
}

export function StandardizedFormSubmit({
  isSubmitting,
  submitText = COPY.BUTTONS.SUBMIT,
  loadingText = COPY.STATUS.SAVING,
  className,
  variant = 'default'
}: StandardizedFormSubmitProps) {
  return (
    <button
      type="submit"
      disabled={isSubmitting}
      className={cn(
        "inline-flex items-center justify-center rounded-md text-sm font-medium",
        "ring-offset-background transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        "h-10 px-4 py-2",
        variant === 'default' && "bg-primary text-primary-foreground hover:bg-primary/90",
        variant === 'destructive' && "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        variant === 'outline' && "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        className
      )}
    >
      {isSubmitting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {loadingText}
        </>
      ) : (
        submitText
      )}
    </button>
  );
}

// Validation message component using brand guidelines
interface ValidationMessageProps {
  type: 'error' | 'success' | 'warning' | 'info';
  message: string;
  className?: string;
}

export function ValidationMessage({ type, message, className }: ValidationMessageProps) {
  const getIcon = () => {
    switch (type) {
      case 'error':
        return <AlertCircle className="w-4 h-4" />;
      case 'success':
        return <CheckCircle className="w-4 h-4" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4" />;
      case 'info':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getColorClasses = () => {
    switch (type) {
      case 'error':
        return 'text-destructive';
      case 'success':
        return 'text-success';
      case 'warning':
        return 'text-warning';
      case 'info':
        return 'text-info';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div className={cn(
      "flex items-center gap-2 text-xs",
      getColorClasses(),
      className
    )}>
      {getIcon()}
      <span>{message}</span>
    </div>
  );
}