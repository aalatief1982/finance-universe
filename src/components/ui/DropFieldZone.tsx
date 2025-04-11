// src/components/ui/DropFieldZone.tsx
import React from 'react';
import { useDrop } from 'react-dnd';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface DropFieldZoneProps {
  field: string;
  tokens: string[];
  onDropToken: (field: string, token: string) => void;
  onRemoveToken: (field: string, token: string) => void;
}

const DropFieldZone: React.FC<DropFieldZoneProps> = ({ field, tokens, onDropToken, onRemoveToken }) => {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'token',
    drop: (item: { token: string }) => {
      onDropToken(field, item.token);
    },
    collect: monitor => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop()
    })
  });

  const isActive = isOver && canDrop;

  return (
    <div
      ref={drop}
      className={cn(
        'p-4 border rounded-md min-h-[80px] bg-muted/20 transition-all',
        isActive ? 'border-primary bg-primary/10' : 'border-muted'
      )}
    >
      <h4 className="text-xs font-bold uppercase mb-2">{field}</h4>
      <div className="flex flex-wrap gap-2">
        {tokens.map(token => (
          <Badge
            key={token}
            className="flex items-center gap-1 px-2 py-1 text-xs cursor-pointer bg-teal-600 text-white hover:bg-teal-700"
          >
            {token}
            <span
              onClick={() => onRemoveToken(field, token)}
              className="ml-1 text-white hover:text-red-300 text-xs"
              style={{ cursor: 'pointer' }}
            >
              ×
            </span>
          </Badge>
        ))}
      </div>
    </div>
  );
};

export default DropFieldZone;
