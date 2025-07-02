import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export interface SmartPasteReviewQueueModalProps {
  open: boolean;
  messages: { sender: string; body: string }[];
  onClose: () => void;
}

const SmartPasteReviewQueueModal: React.FC<SmartPasteReviewQueueModalProps> = ({
  open,
  messages,
  onClose,
}) => (
  <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
    <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Review Incoming Messages</DialogTitle>
      </DialogHeader>
      <div className="space-y-2 pb-4">
        {messages.map((m, idx) => (
          <Card key={idx} className="p-[var(--card-padding)]">
            <div className="text-sm text-muted-foreground mb-1">{m.sender}</div>
            <pre className="whitespace-pre-wrap break-words text-sm">{m.body}</pre>
          </Card>
        ))}
      </div>
      <DialogFooter>
        <Button onClick={onClose}>Close</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

export default SmartPasteReviewQueueModal;
