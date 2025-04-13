
import React, { RefObject } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { TextSelection } from '@/pages/TrainModel';

interface TextAnnotatorProps {
  value: string;
  onChange: (value: string) => void;
  selections: TextSelection[];
  onSelectionChange: () => void;
  textAreaRef: RefObject<HTMLTextAreaElement>;
}

const TextAnnotator: React.FC<TextAnnotatorProps> = ({
  value,
  onChange,
  selections,
  onSelectionChange,
  textAreaRef
}) => {
  return (
    <div className="relative">
      <Textarea
        ref={textAreaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onMouseUp={onSelectionChange}
        onKeyUp={onSelectionChange}
        className="min-h-[120px] w-full resize-y text-base p-4"
        placeholder="Enter message text to train the model..."
      />
      
      {/* Optional visual overlay for selections - for advanced implementations */}
      {selections.length > 0 && (
        <div className="absolute top-0 right-0 bg-primary/10 text-xs px-2 py-1 rounded-bl-md">
          {selections.length} selection{selections.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};

export default TextAnnotator;
