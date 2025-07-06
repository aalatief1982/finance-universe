import React from 'react';
import { CATEGORY_ICON_MAP } from '@/constants/categoryIconMap';
import { cn } from '@/lib/utils';

interface CategoryIconProps {
  category: string;
  size?: number;
}

const CategoryIcon: React.FC<CategoryIconProps> = ({ category, size = 24 }) => {
  const info = CATEGORY_ICON_MAP[category] || CATEGORY_ICON_MAP['Other'];
  const Icon = info.icon;
  const containerSize = `${size}px`;
  const iconSize = size * 0.6;
  return (
    <div
      className={cn('flex items-center justify-center rounded-full', info.background)}
      style={{ width: containerSize, height: containerSize }}
    >
      <Icon className={info.color} size={iconSize} />
    </div>
  );
};

export default CategoryIcon;
