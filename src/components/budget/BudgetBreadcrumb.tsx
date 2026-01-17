import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BudgetBreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function BudgetBreadcrumb({ items, className }: BudgetBreadcrumbProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Preserve URL params when navigating
  const preserveParams = (path: string) => {
    const params = searchParams.toString();
    return params ? `${path}?${params}` : path;
  };

  return (
    <nav className={cn("flex items-center gap-1 text-sm", className)}>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          )}
          {item.path ? (
            <button
              onClick={() => navigate(preserveParams(item.path!))}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {item.label}
            </button>
          ) : (
            <span className="font-medium text-foreground">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

export default BudgetBreadcrumb;
