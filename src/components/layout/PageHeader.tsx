
import React from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  description?: string;
}

const PageHeader = ({
  title,
  actions,
  className = '',
  description
}: PageHeaderProps) => {
  return (
    <div className="sticky top-[calc(var(--header-height)+var(--safe-area-top))] z-20 bg-background border-b">
      <div className="px-[var(--page-padding-x)] py-1.5">
        <div className={cn("flex items-center justify-between gap-2", className)}>
          <div>
            {title && (
              <h1 className="text-xl font-bold tracking-tight">{title}</h1>
            )}
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-1.5">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PageHeader;
