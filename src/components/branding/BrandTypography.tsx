import React from 'react';
import { cn } from '@/lib/utils';
import { getBrandClass } from '@/constants/brandGuidelines';

interface BrandTypographyProps {
  level: 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'small' | 'tiny';
  children: React.ReactNode;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div';
}

const BrandTypography: React.FC<BrandTypographyProps> = ({
  level,
  children,
  className,
  as
}) => {
  const getDefaultTag = (level: string) => {
    switch (level) {
      case 'h1': return 'h1';
      case 'h2': return 'h2';
      case 'h3': return 'h3';
      case 'h4': return 'h4';
      case 'body': return 'p';
      case 'small': return 'span';
      case 'tiny': return 'span';
      default: return 'p';
    }
  };

  const Component = as || getDefaultTag(level);
  const brandClass = getBrandClass(level);

  return React.createElement(
    Component,
    {
      className: cn(brandClass, className)
    },
    children
  );
};

export default BrandTypography;