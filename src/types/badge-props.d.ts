
import * as React from 'react';

declare module '@/components/ui/badge' {
  export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
    className?: string;
    children?: React.ReactNode;
  }
  
  const Badge: React.FC<BadgeProps>;
  export { Badge };
}
