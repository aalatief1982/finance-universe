import React, { Suspense } from 'react';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { cn } from '@/lib/utils';

interface LazyWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
  skeletonVariant?: 'card' | 'list' | 'table' | 'form';
  skeletonCount?: number;
}

const LazyWrapper: React.FC<LazyWrapperProps> = ({
  children,
  fallback,
  className,
  skeletonVariant = 'card',
  skeletonCount = 3
}) => {
  const defaultFallback = (
    <div className={cn('p-4', className)}>
      <LoadingSkeleton 
        variant={skeletonVariant} 
        count={skeletonCount} 
      />
    </div>
  );

  return (
    <Suspense fallback={fallback || defaultFallback}>
      {children}
    </Suspense>
  );
};

export { LazyWrapper };