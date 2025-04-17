
declare module '@/components/ui/badge' {
  import * as React from 'react';

  export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
    className?: string;
    children?: React.ReactNode; // Updated to use ReactNode instead of string
  }

  export const Badge: React.FC<BadgeProps>;
  export const badgeVariants: (props?: any) => string;
}
