
declare module '@/components/ui/button' {
  import * as React from 'react';

  export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    size?: 'default' | 'sm' | 'lg' | 'xl' | 'icon';
    asChild?: boolean;
    children?: React.ReactNode;
    className?: string;
    onClick?: React.MouseEventHandler<HTMLButtonElement>;
    type?: 'button' | 'submit' | 'reset';
    disabled?: boolean;
    'aria-label'?: string;
    'aria-busy'?: boolean;
    'aria-describedby'?: string;
    'aria-disabled'?: boolean;
  }

  export const Button: React.ForwardRefExoticComponent<
    ButtonProps & React.RefAttributes<HTMLButtonElement>
  >;
}
