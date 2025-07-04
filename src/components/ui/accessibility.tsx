import React from 'react';
import { cn } from '@/lib/utils';

interface ScreenReaderOnlyProps {
  children: React.ReactNode;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
}

const ScreenReaderOnly: React.FC<ScreenReaderOnlyProps> = ({ 
  children, 
  as: Component = 'span',
  className 
}) => {
  return (
    <Component className={cn(
      'sr-only absolute left-[-10000px] w-[1px] h-[1px] overflow-hidden',
      className
    )}>
      {children}
    </Component>
  );
};

interface FocusRingProps {
  children: React.ReactNode;
  className?: string;
  rounded?: boolean;
}

const FocusRing: React.FC<FocusRingProps> = ({ 
  children, 
  className, 
  rounded = true 
}) => {
  return (
    <div className={cn(
      'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
      rounded && 'rounded-md',
      className
    )}>
      {children}
    </div>
  );
};

interface SkipLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

const SkipLink: React.FC<SkipLinkProps> = ({ 
  href, 
  children, 
  className 
}) => {
  return (
    <a
      href={href}
      className={cn(
        'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50',
        'bg-primary text-primary-foreground px-4 py-2 rounded-md',
        'focus:outline-none focus:ring-2 focus:ring-ring',
        className
      )}
    >
      {children}
    </a>
  );
};

export { ScreenReaderOnly, FocusRing, SkipLink };