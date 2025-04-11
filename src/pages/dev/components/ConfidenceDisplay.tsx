
import React from 'react';
import { Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface ConfidenceBreakdownProps {
  confidenceBreakdown: {
    matchedFields: number;
    totalFields: number;
    tokenOverlapCount: number;
    senderBonus: number;
    calculatedScore: number;
  } | null;
  isLabelingMode: boolean;
}

const ConfidenceDisplay: React.FC<ConfidenceBreakdownProps> = ({ 
  confidenceBreakdown, 
  isLabelingMode 
}) => {
  if (!confidenceBreakdown) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium flex items-center">
        <Info className="h-4 w-4 mr-1" />
        {isLabelingMode ? "Label Analysis" : "Confidence Breakdown"}
      </h3>
      <Card className="bg-muted/30">
        <CardContent className="p-4 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="text-sm">
              <span className="text-muted-foreground">Matched Fields:</span>
              <span className="font-medium ml-2">
                {confidenceBreakdown.matchedFields}/{confidenceBreakdown.totalFields}
              </span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Token Overlaps:</span>
              <span className="font-medium ml-2">
                {confidenceBreakdown.tokenOverlapCount}
              </span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Sender Hint Bonus:</span>
              <span className={`font-medium ml-2 ${confidenceBreakdown.senderBonus > 0 ? 'text-green-600' : ''}`}>
                +{(confidenceBreakdown.senderBonus * 100).toFixed(1)}%
              </span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Calculated Score:</span>
              <span className="font-medium ml-2">
                {(confidenceBreakdown.calculatedScore * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConfidenceDisplay;
