import React from 'react';
import { cn } from '@/lib/utils';

interface FocusRingProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'accent' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
}

const FocusRing: React.FC<FocusRingProps> = ({ 
  children, 
  className,
  variant = 'default',
  size = 'md'
}) => {
  const variantClasses = {
    default: 'focus-within:ring-ring',
    accent: 'focus-within:ring-accent',
    success: 'focus-within:ring-green-500',
    warning: 'focus-within:ring-yellow-500',
    error: 'focus-within:ring-destructive'
  };

  const sizeClasses = {
    sm: 'focus-within:ring-1 focus-within:ring-offset-1',
    md: 'focus-within:ring-2 focus-within:ring-offset-2',
    lg: 'focus-within:ring-4 focus-within:ring-offset-4'
  };

  return (
    <div className={cn(
      'rounded-md transition-all duration-200',
      'focus-within:ring-offset-background',
      variantClasses[variant],
      sizeClasses[size],
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
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        'transition-all duration-200',
        className
      )}
    >
      {children}
    </a>
  );
};

interface KeyboardNavigationProps {
  children: React.ReactNode;
  className?: string;
}

const KeyboardNavigation: React.FC<KeyboardNavigationProps> = ({ 
  children, 
  className 
}) => {
  return (
    <div 
      className={cn(
        '[&_*:focus]:outline-none [&_*:focus]:ring-2 [&_*:focus]:ring-ring [&_*:focus]:ring-offset-2',
        '[&_button:focus]:ring-primary [&_input:focus]:ring-primary [&_textarea:focus]:ring-primary',
        className
      )}
    >
      {children}
    </div>
  );
};

export { FocusRing, SkipLink, KeyboardNavigation };