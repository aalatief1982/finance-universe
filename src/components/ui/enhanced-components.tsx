import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnimatedButton, AnimatedCard } from '@/components/animations/MicroInteractions';
import BrandTypography from '@/components/branding/BrandTypography';
import StatusBadge from '@/components/branding/StatusBadge';
import { COPY } from '@/components/copy/StandardizedCopy';
import { cn } from '@/lib/utils';

// Enhanced Button with animations and brand guidelines
interface EnhancedButtonProps extends React.ComponentProps<typeof Button> {
  animated?: boolean;
  animationVariant?: 'scale' | 'bounce' | 'pulse' | 'shake';
  loadingText?: string;
  successText?: string;
  isLoading?: boolean;
  isSuccess?: boolean;
}

export const EnhancedButton: React.FC<EnhancedButtonProps> = ({
  animated = true,
  animationVariant = 'scale',
  loadingText = COPY.STATUS.LOADING,
  successText = COPY.STATUS.SUCCESS,
  isLoading = false,
  isSuccess = false,
  children,
  disabled,
  className,
  ...props
}) => {
  const buttonContent = isLoading ? loadingText : isSuccess ? successText : children;
  
  if (animated) {
    return (
      <AnimatedButton
        variant={animationVariant}
        disabled={isLoading || disabled}
        className={cn(
          isLoading && 'opacity-75 cursor-not-allowed',
          isSuccess && 'bg-success text-success-foreground',
          className
        )}
        onClick={props.onClick as any}
      >
        {buttonContent}
      </AnimatedButton>
    );
  }

  return (
    <Button
      disabled={isLoading || disabled}
      className={cn(
        isLoading && 'opacity-75 cursor-not-allowed',
        isSuccess && 'bg-success text-success-foreground',
        className
      )}
      {...props}
    >
      {buttonContent}
    </Button>
  );
};

// Enhanced Card with animations and brand guidelines
interface EnhancedCardProps extends React.ComponentProps<typeof Card> {
  animated?: boolean;
  delay?: number;
  status?: 'default' | 'success' | 'warning' | 'error' | 'info';
  showStatusBadge?: boolean;
  statusText?: string;
}

export const EnhancedCard: React.FC<EnhancedCardProps> = ({
  animated = true,
  delay = 0,
  status = 'default',
  showStatusBadge = false,
  statusText,
  children,
  className,
  ...props
}) => {
  const statusClasses = {
    success: 'border-success/20 bg-success/5',
    warning: 'border-warning/20 bg-warning/5',
    error: 'border-destructive/20 bg-destructive/5',
    info: 'border-info/20 bg-info/5',
    default: ''
  };

  const content = (
    <Card
      className={cn(
        'transition-all duration-200',
        statusClasses[status],
        className
      )}
      {...props}
    >
      {showStatusBadge && statusText && (
        <div className="absolute top-2 right-2">
          <StatusBadge status={status as any} size="sm">
            {statusText}
          </StatusBadge>
        </div>
      )}
      {children}
    </Card>
  );

  if (animated) {
    return (
      <AnimatedCard delay={delay} className="relative">
        {content}
      </AnimatedCard>
    );
  }

  return <div className="relative">{content}</div>;
};

// Enhanced Typography with brand guidelines
interface EnhancedTypographyProps {
  variant: 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'small' | 'tiny';
  children: React.ReactNode;
  className?: string;
  animated?: boolean;
  as?: React.ElementType;
}

export const EnhancedTypography: React.FC<EnhancedTypographyProps> = ({
  variant,
  children,
  className,
  animated = false,
  as
}) => {
  const content = (
    <BrandTypography
      level={variant}
      className={className}
      as={as as any}
    >
      {children}
    </BrandTypography>
  );

  if (animated) {
    return (
      <AnimatedCard delay={0.1}>
        {content}
      </AnimatedCard>
    );
  }

  return content;
};

// Enhanced Status Display
interface EnhancedStatusProps {
  status: 'success' | 'error' | 'warning' | 'info' | 'pending' | 'processing';
  message: string;
  showIcon?: boolean;
  animated?: boolean;
  className?: string;
}

export const EnhancedStatus: React.FC<EnhancedStatusProps> = ({
  status,
  message,
  showIcon = true,
  animated = true,
  className
}) => {
  const content = (
    <StatusBadge
      status={status}
      showIcon={showIcon}
      className={className}
    >
      {message}
    </StatusBadge>
  );

  if (animated) {
    return (
      <AnimatedCard delay={0.2}>
        {content}
      </AnimatedCard>
    );
  }

  return content;
};