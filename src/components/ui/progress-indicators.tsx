import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'error';
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  className,
  showLabel = false,
  size = 'md',
  variant = 'default'
}) => {
  const percentage = Math.min((value / max) * 100, 100);
  
  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };

  const variantClasses = {
    default: 'bg-primary',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500'
  };

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between text-sm text-muted-foreground mb-1">
          <span>Progress</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
      <div className={cn(
        'w-full bg-muted rounded-full overflow-hidden',
        sizeClasses[size]
      )}>
        <div
          className={cn(
            'h-full transition-all duration-300 ease-out',
            variantClasses[variant]
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

interface StepperProps {
  steps: string[];
  currentStep: number;
  className?: string;
}

const Stepper: React.FC<StepperProps> = ({
  steps,
  currentStep,
  className
}) => {
  return (
    <div className={cn('flex items-center w-full', className)}>
      {steps.map((step, index) => (
        <React.Fragment key={index}>
          <div className="flex flex-col items-center">
            <div className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
              'transition-colors duration-200',
              index < currentStep 
                ? 'bg-primary text-primary-foreground' 
                : index === currentStep
                ? 'bg-primary/20 text-primary border-2 border-primary'
                : 'bg-muted text-muted-foreground'
            )}>
              {index + 1}
            </div>
            <span className={cn(
              'text-xs mt-1 text-center max-w-16',
              index <= currentStep ? 'text-foreground' : 'text-muted-foreground'
            )}>
              {step}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div className={cn(
              'flex-1 h-0.5 mx-2',
              index < currentStep ? 'bg-primary' : 'bg-muted'
            )} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export { ProgressBar, Stepper };