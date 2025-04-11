
// Updated MatchResults.tsx with complete drop & removal support and new fields
import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { CardTitle, CardDescription, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, ChevronUp, RefreshCw } from 'lucide-react';
import DropFieldZone from '@/components/ui/DropFieldZone';
import DraggableToken from '@/components/ui/DraggableToken';
import ConfidenceDisplay from './ConfidenceDisplay';
import FieldTokenMap from './FieldTokenMap';
import EntryDetails from './EntryDetails';
import JsonDataView from './JsonDataView';
import TransactionPreview from './TransactionPreview';
import LearningSettings from './LearningSettings';
import { MatchResult } from '@/types/learning';
import { Transaction } from '@/types/transaction';

interface MatchResultsProps {
  matchResult: MatchResult | null;
  isLabelingMode: boolean;
  messageTokens: string[];
  tokenLabels?: Record<string, string>;
  manualFieldTokenMap: Record<string, string[]>;
  dummyTransaction: Transaction;
  setDummyTransaction: React.Dispatch<React.SetStateAction<Transaction>>;
  confidenceBreakdown: {
    matchedFields: number;
    totalFields: number;
    tokenOverlapCount: number;
    senderBonus: number;
    calculatedScore: number;
  } | null;
  handleDropToken: (field: string, token: string) => void;
  handleRemoveToken: (field: string, token: string) => void;
  getTokenFieldMatch?: (token: string) => string | null;
  clearAllLabels: () => void;
  undoLastLabeling: () => void;
  applyAutomaticLabels: () => void;
  learnFromCurrentMessage: () => void;
  labelingHistory: Array<Record<string, string>>;
}

const MatchResults: React.FC<MatchResultsProps> = ({
  matchResult,
  isLabelingMode,
  messageTokens,
  tokenLabels = {},
  manualFieldTokenMap,
  dummyTransaction,
  setDummyTransaction,
  confidenceBreakdown,
  handleDropToken,
  handleRemoveToken,
  getTokenFieldMatch,
  clearAllLabels,
  undoLastLabeling,
  applyAutomaticLabels,
  learnFromCurrentMessage,
  labelingHistory
}) => {
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-500';
    if (confidence >= 0.6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>
            {isLabelingMode ? 'Token Labeling Mode' : 'Match Result'}
          </CardTitle>
          {!isLabelingMode && matchResult && (
            <Badge variant={matchResult.matched ? 'default' : 'outline'} className="ml-2">
              {matchResult.matched ? 'Match Found' : 'No Match'}
            </Badge>
          )}
        </div>
        <CardDescription>
          {isLabelingMode ? (
            <div className="flex items-center justify-between mt-2">
              <span>Drag tokens into the correct fields below</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={clearAllLabels} className="flex items-center gap-1 text-xs">
                  <X className="h-3 w-3" />
                  Clear All
                </Button>
                <Button variant="outline" size="sm" onClick={undoLastLabeling} disabled={labelingHistory.length === 0} className="flex items-center gap-1 text-xs">
                  <ChevronUp className="h-3 w-3" />
                  Undo
                </Button>
                <Button variant="outline" size="sm" onClick={applyAutomaticLabels} className="flex items-center gap-1 text-xs">
                  <RefreshCw className="h-3 w-3" />
                  Auto-detect
                </Button>
              </div>
            </div>
          ) : (
            <>
              Confidence Score:
              <div className="w-full bg-muted rounded-full h-2 mt-1">
                <div className={`h-2 rounded-full ${getConfidenceColor(matchResult?.confidence || 0)}`} style={{ width: `${(matchResult?.confidence || 0) * 100}%` }} />
              </div>
              <span className="ml-2">{((matchResult?.confidence || 0) * 100).toFixed(1)}%</span>
            </>
          )}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {isLabelingMode && (
          <>
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">Tokens</h3>
            <div className="flex flex-wrap border p-3 rounded-md bg-background">
              {messageTokens.map(token => (
                <DraggableToken key={token} token={token} />
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <DropFieldZone field="amount" tokens={manualFieldTokenMap.amount} onDropToken={handleDropToken} onRemoveToken={handleRemoveToken} />
              <DropFieldZone field="currency" tokens={manualFieldTokenMap.currency} onDropToken={handleDropToken} onRemoveToken={handleRemoveToken} />
              <DropFieldZone field="vendor" tokens={manualFieldTokenMap.vendor} onDropToken={handleDropToken} onRemoveToken={handleRemoveToken} />
              <DropFieldZone field="account" tokens={manualFieldTokenMap.account} onDropToken={handleDropToken} onRemoveToken={handleRemoveToken} />
              <DropFieldZone field="type" tokens={manualFieldTokenMap.type} onDropToken={handleDropToken} onRemoveToken={handleRemoveToken} />
              <DropFieldZone field="date" tokens={manualFieldTokenMap.date} onDropToken={handleDropToken} onRemoveToken={handleRemoveToken} />
              <DropFieldZone field="title" tokens={manualFieldTokenMap.title} onDropToken={handleDropToken} onRemoveToken={handleRemoveToken} />
            </div>
          </>
        )}

        {confidenceBreakdown && (
          <ConfidenceDisplay confidenceBreakdown={confidenceBreakdown} isLabelingMode={isLabelingMode} />
        )}

        {(isLabelingMode || matchResult?.entry) && (
          <Tabs defaultValue="fieldmap" className="w-full">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="fieldmap">Field Token Map</TabsTrigger>
              {!isLabelingMode && <TabsTrigger value="entry">Entry Details</TabsTrigger>}
              {!isLabelingMode && <TabsTrigger value="json">JSON Data</TabsTrigger>}
              {isLabelingMode && <TabsTrigger value="preview">Transaction Preview</TabsTrigger>}
              {isLabelingMode && <TabsTrigger value="learning">Learning Settings</TabsTrigger>}
            </TabsList>

            <TabsContent value="fieldmap" className="space-y-4 mt-4">
              <FieldTokenMap fieldTokenMap={isLabelingMode ? manualFieldTokenMap : (matchResult?.entry?.fieldTokenMap || {})} messageTokens={messageTokens} isLabelingMode={isLabelingMode} />
            </TabsContent>

            {!isLabelingMode && matchResult?.entry && (
              <TabsContent value="entry" className="space-y-4 mt-4">
                <EntryDetails entry={matchResult.entry} />
              </TabsContent>
            )}

            {!isLabelingMode && matchResult?.entry && (
              <TabsContent value="json" className="space-y-4 mt-4">
                <JsonDataView entry={matchResult.entry} />
              </TabsContent>
            )}

            {isLabelingMode && (
              <TabsContent value="preview" className="space-y-4 mt-4">
                <TransactionPreview transaction={dummyTransaction} />
              </TabsContent>
            )}

            {isLabelingMode && (
              <TabsContent value="learning" className="space-y-4 mt-4">
                <LearningSettings dummyTransaction={dummyTransaction} setDummyTransaction={setDummyTransaction} onLearnFromCurrentMessage={learnFromCurrentMessage} />
              </TabsContent>
            )}
          </Tabs>
        )}
      </CardContent>
    </div>
  );
};

export default MatchResults;
