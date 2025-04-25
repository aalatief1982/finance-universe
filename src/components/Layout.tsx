
import React from 'react';
import { AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import { useIsMobile } from '@/hooks/use-mobile';

interface LayoutProps {
  children: React.ReactNode;
  hideNavigation?: boolean;
  className?: string;
  withPadding?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  hideNavigation = false,
  className = '',
  withPadding = true
}) => {
  const isMobile = useIsMobile();
  
  return (
    <div className={`min-h-screen flex flex-col ${className}`}>
      {!hideNavigation && (
        <>
          {!isMobile && <Sidebar />}
          {isMobile && <MobileNav />}
        </>
      )}
      
      <main
        className={`flex-1 w-full ${!hideNavigation && !isMobile ? 'md:ml-64' : ''}`}
      >
        <div 
          className={`max-w-[var(--content-max-width)] mx-auto ${
            withPadding ? 'px-[var(--page-padding-x)] py-[var(--page-padding-y)]' : 'p-0'
          }`}
        >
          <AnimatePresence mode="wait">
            {children}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default Layout;
