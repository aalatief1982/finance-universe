
import React from 'react';
import { cn } from '@/lib/utils';

interface TokenDropZoneProps {
  fieldName: string;
  label: string;
  isActive: boolean;
  onDrop: (fieldName: string) => void;
}

const TokenDropZone: React.FC<TokenDropZoneProps> = ({
  fieldName,
  label,
  isActive,
  onDrop
}) => {
  return (
    <div 
      className={cn(
        "border-2 border-dashed rounded-md p-3 text-center transition-colors",
        isActive ? "border-primary bg-primary/10" : "border-border"
      )}
      onDrop={() => onDrop(fieldName)}
    >
      <div className="text-sm font-medium">{label}</div>
      <div className="text-xs text-muted-foreground">Drop selection here</div>
    </div>
  );
};

export default TokenDropZone;
