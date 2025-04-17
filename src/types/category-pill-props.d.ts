
import * as React from 'react';

declare module '@/components/CategoryPill' {
  export interface CategoryPillProps {
    category: string;
    onClick?: () => void;
    active?: boolean;
    className?: string;
    key?: string | number;
  }

  const CategoryPill: React.FC<CategoryPillProps>;
  export default CategoryPill;
}
