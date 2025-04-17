
import * as React from 'react';

declare module '@/components/CategoryPill' {
  export interface CategoryPillProps {
    category: string;
    onClick?: () => void;
    active?: boolean;
    className?: string;
    key?: string | number;
  }
}

// Define without export default to avoid duplicate identifier
declare const CategoryPill: React.FC<import('@/components/CategoryPill').CategoryPillProps>;
export default CategoryPill;
