
declare module '@/components/ui/badge' {
  import * as React from 'react';

  export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
    className?: string;
    children?: React.ReactNode;
  }

  export const Badge: React.FC<BadgeProps>;
  export const badgeVariants: (props?: any) => string;
}