
declare module '@/components/ui/textarea' {
  import * as React from 'react';

  export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    id?: string;
    value?: string;
    placeholder?: string;
    onChange?: React.ChangeEventHandler<HTMLTextAreaElement>;
    className?: string;
    dir?: string;
  }

  export const Textarea: React.ForwardRefExoticComponent<
    TextareaProps & React.RefAttributes<HTMLTextAreaElement>
  >;
}
