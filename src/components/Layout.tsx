/**
 * @file Layout.tsx
 * @description UI component for Layout.
 *
 * @module components/Layout
 *
 * @responsibilities
 * 1. Render UI for the feature area
 * 2. Accept props and emit user interactions
 * 3. Compose shared subcomponents where needed
 *
 * @review-tags
 * - @ui: visual/layout behavior
 *
 * @review-checklist
 * - [ ] Props have sensible defaults
 * - [ ] Component renders without crashing
 */

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import Header from './header/Header';
import { useIsMobile } from '@/hooks/use-mobile';
import { useResponsive } from '@/hooks/use-responsive';
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
  /**
   * Apply safe area padding to the top and bottom of the layout.
   * Useful for pages that need to manage safe areas themselves.
   */
  safeAreaPadding?: boolean;
}

const Layout = ({
  children,
  hideNavigation = false,
  className = '',
  withPadding = true,
  showHeader = true,
  fullWidth = false,
  showBack = false,
  safeAreaPadding = true,
}: LayoutProps) => {
  const isMobile = useIsMobile();
  const { isMobile: isResponsiveMobile } = useResponsive();
  const location = useLocation();
  
  return (
    <div
      className={cn(
        "min-h-screen flex flex-col",
        showHeader && "pt-[var(--header-height)]",
        !showHeader && safeAreaPadding && "pt-[var(--safe-area-top)]",
        className
      )}
    >
      {showHeader && <Header showNavigation={!hideNavigation} showBack={showBack} />}

      <div className="flex flex-1">
        <main
          className={cn(
            "flex-1 w-full",
            !fullWidth && "container"
          )}
        >
          <div
            className={cn(
              "h-full",
              withPadding && "p-page",
              !fullWidth && "max-w-[var(--content-max-width)] mx-auto",
              isResponsiveMobile && safeAreaPadding && "pb-safe-bottom"
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
      {!hideNavigation && isMobile && <BottomNav />}
    </div>
  );
};

export default Layout;
