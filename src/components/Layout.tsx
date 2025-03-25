
import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
  animate?: boolean;
}

const Layout = ({ children, className, animate = true }: LayoutProps) => {
  const content = (
    <div className={cn(
      "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10",
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
      >
        {content}
      </motion.div>
    );
  }

  return content;
};

export default Layout;
