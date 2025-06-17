
import React from 'react';
import { AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';
import Header from './header/Header';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import BottomNav from './BottomNav';

interface LayoutProps {
  children: React.ReactNode;
  hideNavigation?: boolean;
  className?: string;
  withPadding?: boolean;
  showHeader?: boolean;
  fullWidth?: boolean;
  showBack?: boolean;
}

const Layout = ({
  children,
  hideNavigation = false,
  className = '',
  withPadding = true,
  showHeader = true,
  fullWidth = false,
  showBack = false,
}: LayoutProps) => {
  const isMobile = useIsMobile();
  
  return (
    <div
      className={cn(
        "min-h-screen flex flex-col",
        "pt-[var(--safe-area-top)]", // Safe area for status bar
        className
      )}
    >
      {showHeader && <Header showNavigation={!hideNavigation} showBack={showBack} />}

      <div className="flex flex-1 mt-[var(--header-height)]">
        {!hideNavigation && !isMobile && <Sidebar />}

        <main
          className={cn(
            "flex-1 w-full",
            !hideNavigation && !isMobile && "lg:ml-[var(--sidebar-width)]",
            !fullWidth && "container"
          )}
        >
          <div
            className={cn(
              "h-full",
              withPadding && "px-[var(--page-padding-x)] py-[var(--page-padding-y)]",
              !fullWidth && "max-w-[var(--content-max-width)] mx-auto"
            )}
          >
            <AnimatePresence mode="wait">
              {children}
            </AnimatePresence>
          </div>
        </main>
      </div>
      {!hideNavigation && isMobile && <BottomNav />}
    </div>
  );
};

export default Layout;
