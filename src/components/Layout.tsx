
import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
  animate?: boolean;
  withPadding?: boolean;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '7xl' | 'full';
  centerContent?: boolean;
  hideNavigation?: boolean; // Added this prop to fix the TypeScript error
}

const Layout = ({ 
  children, 
  className, 
  animate = true, 
  withPadding = true,
  maxWidth = '7xl',
  centerContent = true,
  hideNavigation // Added this prop (not used in the component itself but passed by parent components)
}: LayoutProps) => {
  
  // Define max width class based on prop
  const maxWidthClass = maxWidth === 'full' 
    ? 'w-full' 
    : `max-w-${maxWidth}`;
  
  const content = (
    <div className={cn(
      maxWidthClass,
      centerContent && "mx-auto",
      withPadding && "px-4 sm:px-6 lg:px-8 py-6 md:py-10",
      className
    )}>
      {children}
    </div>
  );

  if (animate) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full"
      >
        {content}
      </motion.div>
    );
  }

  return content;
};

export default Layout;
