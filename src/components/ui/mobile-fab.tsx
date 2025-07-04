import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileFABProps {
  onClick: () => void;
  icon?: React.ReactNode;
  className?: string;
  'aria-label'?: string;
}

const MobileFAB: React.FC<MobileFABProps> = ({
  onClick,
  icon = <Plus className="h-6 w-6" />,
  className,
  'aria-label': ariaLabel = 'Add new item'
}) => {
  return (
    <Button
      onClick={onClick}
      size="icon"
      className={cn(
        'fixed bottom-4 right-4 z-50 h-14 w-14 rounded-full shadow-lg',
        'bg-primary text-primary-foreground hover:bg-primary/90',
        'transition-transform duration-200 hover:scale-110 active:scale-95',
        'safe-area-bottom',
        className
      )}
      aria-label={ariaLabel}
    >
      {icon}
    </Button>
  );
};

export { MobileFAB };