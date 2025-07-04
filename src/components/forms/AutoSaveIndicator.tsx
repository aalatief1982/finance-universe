import React from 'react';
import { cn } from '@/lib/utils';
import { Save, Check, AlertCircle, Loader2 } from 'lucide-react';

interface AutoSaveIndicatorProps {
  status: 'idle' | 'saving' | 'saved' | 'error';
  lastSaved?: Date;
  className?: string;
}

const AutoSaveIndicator: React.FC<AutoSaveIndicatorProps> = ({
  status,
  lastSaved,
  className
}) => {
  const getStatusContent = () => {
    switch (status) {
      case 'saving':
        return (
          <>
            <Loader2 size={14} className="animate-spin" />
            <span>Saving...</span>
          </>
        );
      case 'saved':
        return (
          <>
            <Check size={14} className="text-success" />
            <span className="text-success">
              Saved {lastSaved ? `at ${lastSaved.toLocaleTimeString()}` : ''}
            </span>
          </>
        );
      case 'error':
        return (
          <>
            <AlertCircle size={14} className="text-destructive" />
            <span className="text-destructive">Failed to save</span>
          </>
        );
      default:
        return (
          <>
            <Save size={14} className="text-muted-foreground" />
            <span className="text-muted-foreground">Auto-save enabled</span>
          </>
        );
    }
  };

  return (
    <div className={cn(
      "flex items-center gap-1.5 text-xs transition-all",
      className
    )}>
      {getStatusContent()}
    </div>
  );
};

export default AutoSaveIndicator;