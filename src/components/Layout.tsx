
import React from 'react';
import { AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import { useIsMobile } from '@/hooks/use-mobile';

interface LayoutProps {
  children: React.ReactNode;
  hideNavigation?: boolean;
  className?: string;
  withPadding?: boolean; // Add the missing prop
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  hideNavigation = false,
  className = '',
  withPadding = true // Add default value for the new prop
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
      
      <main className={`flex-1 container mx-auto ${withPadding ? 'px-4 pt-4 pb-20' : 'p-0'} ${!hideNavigation && !isMobile ? 'md:ml-64' : ''}`}>
        <AnimatePresence mode="wait">
          {children}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Layout;
