
import React from 'react';
import { cn } from '@/lib/utils';

// Define colors for different categories using semantic tokens
const categoryColors: Record<string, string> = {
  'food': 'bg-category-food/10 text-category-food border-category-food/20',
  'transportation': 'bg-category-transport/10 text-category-transport border-category-transport/20',
  'entertainment': 'bg-category-entertainment/10 text-category-entertainment border-category-entertainment/20',
  'shopping': 'bg-accent/10 text-accent border-accent/20',
  'utilities': 'bg-muted text-muted-foreground border-border',
  'housing': 'bg-category-housing/10 text-category-housing border-category-housing/20',
  'healthcare': 'bg-category-healthcare/10 text-category-healthcare border-category-healthcare/20',
  'education': 'bg-info/10 text-info border-info/20',
  'default': 'bg-muted text-muted-foreground border-border',
};

interface CategoryPillProps {
  category: string;
  onClick?: () => void;
  active?: boolean;
  className?: string;
}

const CategoryPill = ({
  category,
  onClick,
  active = false,
  className,
}: CategoryPillProps) => {
  const categoryLower = category.toLowerCase();
  const colorClasses = categoryColors[categoryLower] || categoryColors.default;
  
  return (
    <div
      className={cn(
        "px-3 py-1 rounded-full text-xs font-medium border transition-all",
        colorClasses,
        active && "ring-2 ring-offset-2 ring-offset-background",
        onClick && "cursor-pointer hover:opacity-90",
        className
      )}
      onClick={onClick}
    >
      {category}
    </div>
  );
};

export default CategoryPill;
