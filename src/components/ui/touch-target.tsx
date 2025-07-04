import React from 'react';
import { cn } from '@/lib/utils';

interface TouchTargetProps {
  children: React.ReactNode;
  className?: string;
  asChild?: boolean;
}

const TouchTarget: React.FC<TouchTargetProps> = ({
  children,
  className,
  asChild = false
}) => {
  if (asChild) {
    return React.cloneElement(children as React.ReactElement, {
      className: cn('touch-target', (children as React.ReactElement).props.className)
    });
  }

  return (
    <div className={cn(
      'touch-target',
      'flex items-center justify-center',
      className
    )}>
      {children}
    </div>
  );
};

export { TouchTarget };