import React from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { LayoutDashboard, BarChart3, Lightbulb, Wallet } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';

const NAV_ITEMS = [
  { path: '/budget', labelKey: 'budgetNav.dashboard', icon: LayoutDashboard },
  { path: '/budget/report', labelKey: 'budgetNav.reports', icon: BarChart3 },
  { path: '/budget/insights', labelKey: 'budgetNav.insights', icon: Lightbulb },
  { path: '/budget/accounts', labelKey: 'budgetNav.accounts', icon: Wallet },
];

interface BudgetNavProps {
  className?: string;
}

export function BudgetNav({ className }: BudgetNavProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useLanguage();
  
  const preserveParams = (path: string) => {
    const params = searchParams.toString();
    return params ? `${path}?${params}` : path;
  };
  
  const isActive = (path: string) => {
    if (path === '/budget') {
      return location.pathname === '/budget';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className={cn("flex gap-1 p-1 bg-muted/50 rounded-lg", className)}>
      {NAV_ITEMS.map(item => {
        const active = isActive(item.path);
        const Icon = item.icon;
        
        return (
          <button
            key={item.path}
            onClick={() => navigate(preserveParams(item.path))}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
              active 
                ? "bg-background text-foreground shadow-sm" 
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{t(item.labelKey)}</span>
          </button>
        );
      })}
    </nav>
  );
}

export default BudgetNav;
