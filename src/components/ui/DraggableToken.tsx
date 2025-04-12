
// src/components/ui/DraggableToken.tsx
import React from 'react';
import { useDrag } from 'react-dnd';
import { cn } from '@/lib/utils';

interface DraggableTokenProps {
  token: string;
}

const DraggableToken: React.FC<DraggableTokenProps> = ({ token }) => {
  const [{ isDragging }, dragRef] = useDrag(() => ({
    type: 'token',
    item: { token },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  }), [token]);

  return (
    <div 
      ref={dragRef}
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        "border-transparent bg-primary text-primary-foreground",
        "cursor-move",
        isDragging ? 'opacity-50' : 'opacity-100'
      )}
    >
      {token}
    </div>
  );
};

export default DraggableToken;
