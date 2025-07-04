import React from 'react';
import { cn } from '@/lib/utils';
import { useResponsive } from '@/hooks/use-responsive';
import { ResponsiveContainer } from '@/components/ui/responsive-container';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  showMobileNavigation?: boolean;
}

const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  className,
  maxWidth = 'lg',
  showMobileNavigation = true
}) => {
  const { isMobile } = useResponsive();

  return (
    <div className={cn(
      'min-h-screen bg-background',
      'flex flex-col',
      className
    )}>
      {/* Main Content */}
      <main className={cn(
        'flex-1 w-full',
        'p-page',
        isMobile && showMobileNavigation && 'pb-20' // Space for mobile nav
      )}>
        <ResponsiveContainer maxWidth={maxWidth}>
          {children}
        </ResponsiveContainer>
      </main>
    </div>
  );
};

export { ResponsiveLayout };