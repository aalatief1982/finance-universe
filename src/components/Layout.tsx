
import React from 'react';
import { AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';
import Header from './header/Header';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: React.ReactNode;
  hideNavigation?: boolean;
  className?: string;
  withPadding?: boolean;
  showHeader?: boolean;
  fullWidth?: boolean;
}

const Layout = ({
  children,
  hideNavigation = false,
  className = '',
  withPadding = true,
  showHeader = true,
  fullWidth = false,
}: LayoutProps) => {
  const isMobile = useIsMobile();
  
  return (
    <div className={cn("min-h-screen bg-background", className)}>
      {showHeader && <Header showNavigation={!hideNavigation} />}

      <div className="flex">
        {!hideNavigation && !isMobile && (
          <div className="w-64 flex-shrink-0">
            <Sidebar />
          </div>
        )}

        <main className={cn(
          "flex-1 min-h-screen",
          showHeader && "pt-16",
          !fullWidth && "max-w-none"
        )}>
          <div className={cn(
            "w-full h-full",
            withPadding && "p-4",
            !fullWidth && "container mx-auto"
          )}>
            <AnimatePresence mode="wait">
              {children}
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
