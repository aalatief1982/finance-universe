
declare module '@/components/CategoryPill' {
  import * as React from 'react';

  export interface CategoryPillProps {
    category: string;
    onClick?: () => void;
    active?: boolean;
    className?: string;
    key?: string | number;
  }

  export const CategoryPill: React.FC<CategoryPillProps>;
}
