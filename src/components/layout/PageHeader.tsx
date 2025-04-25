
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
      <div className="px-[var(--page-padding-x)] py-4">
        <div className={cn("flex items-center justify-between gap-4", className)}>
          <div className="flex items-center gap-3">
            {showBack && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="flex lg:hidden"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
              {description && (
                <p className="text-sm text-muted-foreground mt-1">{description}</p>
              )}
            </div>
          </div>
          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PageHeader;
