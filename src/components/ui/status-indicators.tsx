import React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react';

type StatusType = 'success' | 'error' | 'warning' | 'pending';

interface StatusIndicatorProps {
  status: StatusType;
  message?: string;
  className?: string;
  showIcon?: boolean;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  message,
  className,
  showIcon = true
}) => {
  const statusConfig = {
    success: {
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50 border-green-200',
      darkBgColor: 'dark:bg-green-950 dark:border-green-800'
    },
    error: {
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50 border-red-200',
      darkBgColor: 'dark:bg-red-950 dark:border-red-800'
    },
    warning: {
      icon: AlertCircle,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50 border-yellow-200',
      darkBgColor: 'dark:bg-yellow-950 dark:border-yellow-800'
    },
    pending: {
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 border-blue-200',
      darkBgColor: 'dark:bg-blue-950 dark:border-blue-800'
    }
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className={cn(
      'flex items-center gap-2 p-3 rounded-lg border',
      config.bgColor,
      config.darkBgColor,
      'animate-fade-in',
      className
    )}>
      {showIcon && (
        <Icon className={cn('h-4 w-4', config.color)} />
      )}
      {message && (
        <span className={cn('text-sm font-medium', config.color)}>
          {message}
        </span>
      )}
    </div>
  );
};

export { StatusIndicator, type StatusType };