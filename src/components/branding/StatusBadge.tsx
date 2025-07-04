import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CheckCircle, AlertCircle, AlertTriangle, Info, Clock } from 'lucide-react';

interface StatusBadgeProps {
  status: 'success' | 'error' | 'warning' | 'info' | 'pending' | 'processing';
  children: React.ReactNode;
  showIcon?: boolean;
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  children,
  showIcon = true,
  size = 'default',
  className
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'success':
        return {
          icon: CheckCircle,
          className: 'bg-success/10 text-success border-success/20 hover:bg-success/20'
        };
      case 'error':
        return {
          icon: AlertCircle,
          className: 'bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20'
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          className: 'bg-warning/10 text-warning border-warning/20 hover:bg-warning/20'
        };
      case 'info':
        return {
          icon: Info,
          className: 'bg-info/10 text-info border-info/20 hover:bg-info/20'
        };
      case 'pending':
        return {
          icon: Clock,
          className: 'bg-muted/50 text-muted-foreground border-muted'
        };
      case 'processing':
        return {
          icon: Clock,
          className: 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20'
        };
      default:
        return {
          icon: Info,
          className: 'bg-muted text-muted-foreground border-border'
        };
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-2 py-0.5 text-xs gap-1';
      case 'lg':
        return 'px-3 py-1 text-sm gap-1.5';
      default:
        return 'px-2.5 py-0.5 text-xs gap-1';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm':
        return 10;
      case 'lg':
        return 14;
      default:
        return 12;
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn(
        'inline-flex items-center border transition-colors',
        config.className,
        getSizeClasses(),
        className
      )}
    >
      {showIcon && <Icon size={getIconSize()} />}
      {children}
    </Badge>
  );
};

export default StatusBadge;