
declare module 'react-hook-form' {
  export type FieldValues = Record<string, any>;
  
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
    control: any;
    reset: (values?: TFieldValues) => void;
    setValue: (name: string, value: any) => void;
    getValues: () => TFieldValues;
  };
  
  export function useForm<TFieldValues extends FieldValues = FieldValues>(options?: {
    defaultValues?: TFieldValues;
    resolver?: any;
    mode?: 'onSubmit' | 'onChange' | 'onBlur' | 'all';
  }): UseFormReturn<TFieldValues>;
  
  export function Controller(props: {
    name: string;
    control: any;
    defaultValue?: any;
    render: (props: { field: any; fieldState: any }) => React.ReactElement;
  }): JSX.Element;
}
