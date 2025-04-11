import React from 'react';

interface Props {
  token: string;
}

const DraggableToken: React.FC<Props> = ({ token }) => {
  return (
    <div
      draggable
      onDragStart={(e) => e.dataTransfer.setData('text/plain', token)}
      className="inline-block px-2 py-1 m-1 bg-muted text-sm rounded cursor-grab"
    >
      {token}
    </div>
  );
};

export default DraggableToken;
