
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface TransactionInputProps {
  text: string;
  isProcessing: boolean;
  onTextChange: (text: string) => void;
  onPaste: () => void;
}

const TransactionInput: React.FC<TransactionInputProps> = ({ 
  text, 
  isProcessing, 
  onTextChange, 
  onPaste 
}) => {
  return (
    <div className="space-y-2">
      <Input
        placeholder="Paste a bank SMS message..."
        value={text}
        onChange={(e) => onTextChange(e.target.value)}
        className="w-full text-sm"
        disabled={isProcessing}
      />
      <Button 
        onClick={onPaste} 
        className="w-full sm:w-auto text-sm"
        disabled={isProcessing}
      >
        {isProcessing ? "Processing..." : "Paste from Clipboard"}
      </Button>
    </div>
  );
};

export default TransactionInput;
