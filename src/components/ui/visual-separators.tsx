import React from 'react';
import { cn } from '@/lib/utils';

interface SectionDividerProps {
  className?: string;
  variant?: 'default' | 'dashed' | 'dotted' | 'gradient';
  spacing?: 'sm' | 'md' | 'lg';
}

const SectionDivider: React.FC<SectionDividerProps> = ({ 
  className, 
  variant = 'default',
  spacing = 'md'
}) => {
  const spacingClasses = {
    sm: 'my-4',
    md: 'my-6',
    lg: 'my-8'
  };

  const variantClasses = {
    default: 'border-border',
    dashed: 'border-border border-dashed',
    dotted: 'border-border border-dotted',
    gradient: 'border-0 h-px bg-gradient-to-r from-transparent via-border to-transparent'
  };

  if (variant === 'gradient') {
    return (
      <div 
        className={cn(
          'w-full',
          spacingClasses[spacing],
          variantClasses[variant],
          className
        )}
      />
    );
  }

  return (
    <hr 
      className={cn(
        'border-t',
        spacingClasses[spacing],
        variantClasses[variant],
        className
      )}
    />
  );
};

interface ContentGroupProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
  spacing?: 'tight' | 'normal' | 'loose';
}

const ContentGroup: React.FC<ContentGroupProps> = ({ 
  children, 
  title, 
  description, 
  className,
  spacing = 'normal'
}) => {
  const spacingClasses = {
    tight: 'space-y-2',
    normal: 'space-y-4',
    loose: 'space-y-6'
  };

  return (
    <div className={cn('group', spacingClasses[spacing], className)}>
      {(title || description) && (
        <div className="space-y-1">
          {title && (
            <h3 className="text-lg font-semibold text-foreground">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-sm text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      )}
      <div className={spacingClasses[spacing]}>
        {children}
      </div>
    </div>
  );
};

interface VisualCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'outlined' | 'ghost';
  padding?: 'sm' | 'md' | 'lg';
}

const VisualCard: React.FC<VisualCardProps> = ({ 
  children, 
  className,
  variant = 'default',
  padding = 'md'
}) => {
  const variantClasses = {
    default: 'bg-card border border-border shadow-sm',
    elevated: 'bg-card border border-border shadow-lg hover:shadow-xl transition-shadow',
    outlined: 'border-2 border-border bg-transparent',
    ghost: 'bg-transparent hover:bg-accent/5 transition-colors'
  };

  const paddingClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  };

  return (
    <div className={cn(
      'rounded-lg transition-all duration-200',
      variantClasses[variant],
      paddingClasses[padding],
      className
    )}>
      {children}
    </div>
  );
};

export { SectionDivider, ContentGroup, VisualCard };