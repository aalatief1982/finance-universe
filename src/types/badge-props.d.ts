
declare module '@/components/ui/badge' {
  import * as React from 'react';

  export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
    children?: React.ReactNode;
    className?: string;
  }

  export const Badge: React.ForwardRefExoticComponent<
    BadgeProps & React.RefAttributes<HTMLDivElement>
  >;
}
