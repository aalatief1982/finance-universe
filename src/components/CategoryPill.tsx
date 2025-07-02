
import React from 'react';
import { cn } from '@/lib/utils';

// Define colors for different categories
const categoryColors: Record<string, string> = {
  'food': 'bg-amber-100 text-amber-800 border-amber-200',
  'transportation': 'bg-blue-100 text-blue-800 border-blue-200',
  'entertainment': 'bg-purple-100 text-purple-800 border-purple-200',
  'shopping': 'bg-pink-100 text-pink-800 border-pink-200',
  'utilities': 'bg-gray-100 text-gray-800 border-gray-200',
  'housing': 'bg-green-100 text-green-800 border-green-200',
  'healthcare': 'bg-red-100 text-red-800 border-red-200',
  'education': 'bg-indigo-100 text-indigo-800 border-indigo-200',
  'default': 'bg-slate-100 text-slate-800 border-slate-200',
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
