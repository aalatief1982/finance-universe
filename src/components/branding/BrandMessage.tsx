import React from 'react';
import { cn } from '@/lib/utils';
import { getBrandMessage, getBrandClass } from '@/constants/brandGuidelines';

interface BrandMessageProps {
  type: 'errorMessages' | 'successMessages' | 'helpText';
  messageKey: string;
  className?: string;
  variant?: 'default' | 'inline' | 'tooltip';
  children?: React.ReactNode;
}

const BrandMessage: React.FC<BrandMessageProps> = ({
  type,
  messageKey,
  className,
  variant = 'default',
  children
}) => {
  const message = children || getBrandMessage(type, messageKey);
  
  const getVariantClasses = () => {
    switch (variant) {
      case 'inline':
        return 'text-sm text-muted-foreground';
      case 'tooltip':
        return 'text-xs';
      default:
        return 'text-sm';
    }
  };

  const getTypeClasses = () => {
    switch (type) {
      case 'errorMessages':
        return 'text-destructive';
      case 'successMessages':
        return 'text-success';
      case 'helpText':
        return 'text-muted-foreground';
      default:
        return '';
    }
  };

  return (
    <span className={cn(
      getVariantClasses(),
      getTypeClasses(),
      className
    )}>
      {message}
    </span>
  );
};

export default BrandMessage;