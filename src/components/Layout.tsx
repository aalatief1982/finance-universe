
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
		  <div className={`max-w-screen-md mx-auto ${withPadding ? 'px-4 sm:px-6 lg:px-8 pt-6 pb-10' : 'p-0'}`}>
			<AnimatePresence mode="wait">
			  {children}
			</AnimatePresence>
		  </div>
		</main>

    </div>
  );
};

export default Layout;
