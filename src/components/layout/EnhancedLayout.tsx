import React, { Suspense } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { LazyWrapper } from '@/components/performance/LazyWrapper';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { cn } from '@/lib/utils';

interface EnhancedLayoutProps {
  children: React.ReactNode;
  className?: string;
  withAnimation?: boolean;
  withLazyLoading?: boolean;
}

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.3
};

const EnhancedLayout: React.FC<EnhancedLayoutProps> = ({
  children,
  className,
  withAnimation = true,
  withLazyLoading = true
}) => {
  const location = useLocation();
  
  const content = withLazyLoading ? (
    <LazyWrapper
      fallback={<LoadingSkeleton variant="card" count={3} />}
      className="w-full"
    >
      {children}
    </LazyWrapper>
  ) : (
    children
  );

  if (!withAnimation) {
    return <div className={cn('w-full h-full', className)}>{content}</div>;
  }

  return (
    <motion.div
      key={location.pathname}
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      transition={pageTransition}
      className={cn('w-full h-full', className)}
    >
      {content}
    </motion.div>
  );
};

export default EnhancedLayout;