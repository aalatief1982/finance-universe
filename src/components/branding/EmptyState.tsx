import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import BrandTypography from './BrandTypography';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'secondary';
  };
  className?: string;
  compact?: boolean;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  className,
  compact = false
}) => {
  return (
    <Card className={cn(
      "border-dashed",
      compact ? "p-4" : "p-8",
      className
    )}>
      <CardContent className={cn(
        "flex flex-col items-center text-center",
        compact ? "space-y-2" : "space-y-4"
      )}>
        {Icon && (
          <div className={cn(
            "rounded-full bg-muted flex items-center justify-center",
            compact ? "w-10 h-10" : "w-16 h-16"
          )}>
            <Icon 
              className={cn(
                "text-muted-foreground",
                compact ? "w-5 h-5" : "w-8 h-8"
              )} 
            />
          </div>
        )}
        
        <div className="space-y-1">
          <BrandTypography 
            level={compact ? "h4" : "h3"} 
            className="text-foreground"
          >
            {title}
          </BrandTypography>
          <BrandTypography 
            level={compact ? "small" : "body"} 
            className="text-muted-foreground max-w-md"
          >
            {description}
          </BrandTypography>
        </div>
        
        {action && (
          <Button
            variant={action.variant || 'default'}
            onClick={action.onClick}
            size={compact ? "sm" : "default"}
          >
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default EmptyState;