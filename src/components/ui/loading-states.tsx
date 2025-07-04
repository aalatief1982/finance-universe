import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <Loader2 
      className={cn(
        'animate-spin text-primary',
        sizeClasses[size],
        className
      )}
    />
  );
};

interface LoadingButtonProps {
  children: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
}

const LoadingButton: React.FC<LoadingButtonProps> = ({
  children,
  loading = false,
  disabled = false,
  className,
  onClick
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2',
        'px-4 py-2 rounded-md font-medium',
        'bg-primary text-primary-foreground',
        'hover:bg-primary/90 active:scale-[0.98]',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'transition-all duration-200',
        className
      )}
    >
      {loading && <LoadingSpinner size="sm" />}
      {children}
    </button>
  );
};

export { LoadingSpinner, LoadingButton };