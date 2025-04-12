
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
        className={`flex-1 w-full max-w-screen-lg mx-auto ${
          withPadding ? 'px-4 sm:px-6 md:px-8 pt-16 pb-20' : 'p-0'
        } ${!hideNavigation && !isMobile ? 'md:ml-64' : ''}`}
      >
        <AnimatePresence mode="wait">
          {children}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Layout;
