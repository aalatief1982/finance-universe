/**
 * @file BatchProcessingUI.tsx
 * @description UI component for BatchProcessingUI.
 *
 * @module components/forms/BatchProcessingUI
 *
 * @responsibilities
 * 1. Render UI for the feature area
 * 2. Accept props and emit user interactions
 * 3. Compose shared subcomponents where needed
 *
 * @review-tags
 * - @ui: visual/layout behavior
 *
 * @review-checklist
 * - [ ] Props have sensible defaults
 * - [ ] Component renders without crashing
 */
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, Loader2, X } from 'lucide-react';
import { getBrandMessage } from '@/constants/brandGuidelines';

interface BatchItem {
  id: string;
  title: string;
  status: 'pending' | 'processing' | 'success' | 'error';
  message?: string;
}

interface BatchProcessingUIProps {
  title: string;
  items: BatchItem[];
  progress: number;
  isProcessing: boolean;
  onCancel?: () => void;
  onRetry?: (itemId: string) => void;
}

const BatchProcessingUI: React.FC<BatchProcessingUIProps> = ({
  title,
  items,
  progress,
  isProcessing,
  onCancel,
  onRetry
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing':
        return <Loader2 size={16} className="text-info animate-spin" />;
      case 'success':
        return <CheckCircle size={16} className="text-success" />;
      case 'error':
        return <AlertCircle size={16} className="text-destructive" />;
      default:
        return <div className="w-4 h-4 rounded-full border-2 border-muted" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'processing':
        return 'Processing...';
      case 'success':
        return 'Completed';
      case 'error':
        return 'Failed';
      default:
        return 'Pending';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-medium">{title}</CardTitle>
        {onCancel && isProcessing && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="h-8 w-8 p-0"
          >
            <X size={16} />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2 border rounded-md bg-muted/30"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {getStatusIcon(item.status)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.message || getStatusText(item.status)}
                    </p>
                  </div>
                </div>
                
                {item.status === 'error' && onRetry && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRetry(item.id)}
                    className="h-8 px-2 text-xs"
                  >
                    Retry
                  </Button>
                )}
              </div>
            ))}
          </div>

          {!isProcessing && progress === 100 && (
            <div className="text-center p-2 bg-success/10 text-success rounded-md">
              {getBrandMessage('successMessages', 'import')}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default BatchProcessingUI;