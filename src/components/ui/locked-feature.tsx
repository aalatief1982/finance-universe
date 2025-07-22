
import React from 'react';
import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LockedFeatureProps {
  isLocked: boolean;
  featureName: string;
  children: React.ReactNode;
  onLockedClick?: () => void;
  className?: string;
}

export const LockedFeature: React.FC<LockedFeatureProps> = ({
  isLocked,
  featureName,
  children,
  onLockedClick,
  className
}) => {
  if (!isLocked) {
    return <>{children}</>;
  }

  return (
    <div className={cn("relative", className)}>
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center cursor-pointer rounded-lg"
        onClick={() => onLockedClick?.()}
      >
        <div className="text-center">
          <Lock className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Feature locked</p>
        </div>
      </div>
      <div className="opacity-50 pointer-events-none">
        {children}
      </div>
    </div>
  );
};
