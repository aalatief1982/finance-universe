
import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
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
  const location = useLocation();
  
  return (
    <div
      className={cn(
        "flex flex-col h-dvh overflow-hidden",
        showHeader && "pt-[var(--header-height)]",
        !showHeader && "pt-[var(--safe-area-top)]",
        className
      )}
    >
      {showHeader && (
        <header className="fixed top-0 left-0 right-0 z-50 h-[var(--header-height)] bg-white shadow-md">
          <Header showNavigation={!hideNavigation} showBack={showBack} />
        </header>
      )}

      <div className="flex flex-1">
        {!hideNavigation && !isMobile && <Sidebar />}

        <main
          className={cn(
            "flex-1 w-full overflow-y-auto",
            !hideNavigation && !isMobile && "lg:ms-[var(--sidebar-width)]",
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
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={location.pathname}>
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
      {!hideNavigation && isMobile && (
        <footer className="fixed bottom-0 left-0 right-0 z-50 bg-white shadow-inner">
          <BottomNav />
        </footer>
      )}
    </div>
  );
};

export default Layout;
