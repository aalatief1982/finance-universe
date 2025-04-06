
import React from 'react';
import { AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import { useIsMobile } from '@/hooks/use-mobile';

interface LayoutProps {
  children: React.ReactNode;
  hideNavigation?: boolean;
  className?: string;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  hideNavigation = false,
  className = ''
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
      
      <main className={`flex-1 container mx-auto px-4 pt-4 pb-20 ${!hideNavigation && !isMobile ? 'md:ml-64' : ''}`}>
        <AnimatePresence mode="wait">
          {children}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Layout;
