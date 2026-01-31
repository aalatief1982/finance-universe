/**
 * @file react-hook-form.d.ts
 * @description Type definitions for react-hook-form.d.
 *
 * @module types/react-hook-form.d
 *
 * @responsibilities
 * 1. Define shared interfaces and type aliases
 * 2. Provide consistent contracts across services and UI
 *
 * @review-tags
 * - @data-contract: shared types
 *
 * @review-checklist
 * - [ ] Types align with runtime data shapes
 * - [ ] Optional fields documented where needed
 */

declare module 'react-hook-form' {
  export type FieldValues = Record<string, any>;
  
  export type Control<TFieldValues extends FieldValues = FieldValues> = any;
  
  export type FieldPath<TFieldValues extends FieldValues = FieldValues> = string;
  
  export type UseFormRegister<TFieldValues extends FieldValues> = (name: string) => {
    onChange: (event: any) => void;
    onBlur: () => void;
    ref: (ref: any) => void;
    name: string;
  };

  export type SubmitHandler<TFieldValues extends FieldValues> = (
    data: TFieldValues,
    e?: React.BaseSyntheticEvent,
  ) => void | Promise<void>;
  
  export type UseFormReturn<TFieldValues extends FieldValues> = {
    register: UseFormRegister<TFieldValues>;
    handleSubmit: (onSubmit: SubmitHandler<TFieldValues>) => (e?: React.BaseSyntheticEvent) => Promise<void>;
    formState: {
      errors: any;
      isSubmitting: boolean;
    };
    control: Control<TFieldValues>;
    reset: (values?: TFieldValues) => void;
    setValue: (name: string, value: any) => void;
    getValues: () => TFieldValues;
    watch: (name?: string | string[]) => any;
  };
  
  export function useForm<TFieldValues extends FieldValues = FieldValues>(options?: {
    defaultValues?: TFieldValues;
    resolver?: any;
    mode?: 'onSubmit' | 'onChange' | 'onBlur' | 'all';
  }): UseFormReturn<TFieldValues>;
  
  export function Controller(props: {
    name: string;
    control: Control;
    defaultValue?: any;
    render: (props: { field: any; fieldState: any }) => React.ReactElement;
  }): JSX.Element;
  
  export const FormProvider: React.FC<{
    children: React.ReactNode;
    [key: string]: any;
  }>;
  
  export function useFormContext<TFieldValues extends FieldValues = FieldValues>(): UseFormReturn<TFieldValues>;
}
