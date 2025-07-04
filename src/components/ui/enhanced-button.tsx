import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { LoadingSpinner } from './loading-states';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow hover:bg-primary/90 active:scale-[0.98]',
        destructive: 'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 active:scale-[0.98]',
        outline: 'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground active:scale-[0.98]',
        secondary: 'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 active:scale-[0.98]',
        ghost: 'hover:bg-accent hover:text-accent-foreground active:scale-[0.98]',
        link: 'text-primary underline-offset-4 hover:underline',
        gradient: 'bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]',
        glow: 'bg-primary text-primary-foreground shadow-lg hover:shadow-[0_0_20px_hsl(var(--primary)/0.5)] hover:scale-[1.02] active:scale-[0.98]'
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-md px-8',
        xl: 'h-12 rounded-lg px-10 text-base',
        icon: 'h-9 w-9'
      },
      animation: {
        none: '',
        bounce: 'hover:animate-bounce-in',
        pulse: 'hover:animate-pulse',
        float: 'hover:-translate-y-1 hover:shadow-lg'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      animation: 'none'
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  loadingText?: string;
}

const EnhancedButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, animation, loading = false, loadingText, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, animation, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <LoadingSpinner size="sm" />}
        {loading && loadingText ? loadingText : children}
      </button>
    );
  }
);
EnhancedButton.displayName = 'EnhancedButton';

export { EnhancedButton, buttonVariants };