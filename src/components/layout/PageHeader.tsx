
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  showBack?: boolean;
  actions?: React.ReactNode;
  className?: string;
  description?: string;
}

const PageHeader = ({
  title,
  showBack = false,
  actions,
  className = '',
  description
}: PageHeaderProps) => {
  const navigate = useNavigate();

  return (
    <div className="sticky top-[var(--header-height)] z-10 bg-background/80 backdrop-blur-xl border-b">
      <div className="px-[var(--page-padding-x)] py-2.5">
        <div className={cn("flex items-center justify-between gap-2", className)}>
          <div className="flex items-center gap-2">
            {showBack && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="flex lg:hidden"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div>
              <h1 className="text-xl font-bold tracking-tight">{title}</h1>
              {description && (
                <p className="text-xs text-muted-foreground">{description}</p>
              )}
            </div>
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
