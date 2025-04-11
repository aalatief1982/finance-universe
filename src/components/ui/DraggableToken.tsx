
// src/components/ui/DraggableToken.tsx
import React from 'react';
import { useDrag } from 'react-dnd';
import { Badge } from '@/components/ui/badge';

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
    <Badge
      ref={dragRef}
      className={`cursor-move px-2 py-1 text-xs ${isDragging ? 'opacity-50' : 'opacity-100'}`}
    >
      {token}
    </Badge>
  );
};

export default DraggableToken;
