
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CardContent, CardFooter } from '@/components/ui/card';
import { Pencil } from 'lucide-react';

interface MessageInputProps {
  message: string;
  setMessage: React.Dispatch<React.SetStateAction<string>>;
  senderHint: string;
  setSenderHint: React.Dispatch<React.SetStateAction<string>>;
  isLabelingMode: boolean;
  toggleLabelingMode: () => void;
  onTestMatching: () => void;
}

const MessageInput: React.FC<MessageInputProps> = ({
  message,
  setMessage,
  senderHint,
  setSenderHint,
  isLabelingMode,
  toggleLabelingMode,
  onTestMatching
}) => {
  return (
    <>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Message</label>
          <Textarea
            placeholder="Paste your bank message here..."
            className="min-h-[100px]"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Sender Hint (optional)</label>
          <Input
            placeholder="e.g., Bank name or phone number"
            value={senderHint}
            onChange={(e) => setSenderHint(e.target.value)}
          />
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button onClick={onTestMatching} className="flex-1 mr-2">Test Matching</Button>
        <Button 
          variant={isLabelingMode ? "secondary" : "outline"} 
          onClick={toggleLabelingMode}
          className="flex items-center gap-1"
        >
          <Pencil className="h-4 w-4" />
          {isLabelingMode ? "Exit Labeling Mode" : "Enter Labeling Mode"}
        </Button>
      </CardFooter>
    </>
  );
};

export default MessageInput;
