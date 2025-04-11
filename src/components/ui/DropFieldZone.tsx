import React from 'react';

interface Props {
  field: string;
  tokens: string[];
  onDropToken: (field: string, token: string) => void;
}

const DropFieldZone: React.FC<Props> = ({ field, tokens, onDropToken }) => {
  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        const token = e.dataTransfer.getData('text/plain');
        onDropToken(field, token);
      }}
      className="min-h-[40px] p-2 border rounded-md bg-white mb-3"
    >
      <strong>{field.toUpperCase()}</strong>
      <div className="flex flex-wrap mt-2">
        {tokens.map((token, i) => (
          <span key={i} className="px-2 py-1 m-1 bg-primary text-white text-xs rounded">
            {token}
          </span>
        ))}
      </div>
    </div>
  );
};

export default DropFieldZone;
