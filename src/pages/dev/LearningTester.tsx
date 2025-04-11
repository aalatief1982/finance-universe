
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { learningEngineService } from '@/services/LearningEngineService';
import { MatchResult } from '@/types/learning';
import { Transaction, TransactionType } from '@/types/transaction';
import { SupportedCurrency } from '@/types/locale';
import { AlertCircle, ChevronDown, ChevronUp, FileText, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const LearningTester: React.FC = () => {
  const [message, setMessage] = useState<string>('');
  const [senderHint, setSenderHint] = useState<string>('');
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [isJsonExpanded, setIsJsonExpanded] = useState(false);
  const [dummyTransaction, setDummyTransaction] = useState<Transaction>({
    id: '',
    date: new Date().toISOString(),
    amount: 0,
    currency: 'USD' as SupportedCurrency,
    description: '',
    type: 'expense' as TransactionType,
    category: 'Uncategorized',
    fromAccount: '',
    toAccount: '',
    // Add the missing required properties
    title: '',
    source: 'manual'
  });
  const { toast } = useToast();

  const findBestMatch = () => {
    if (!message) {
      toast({
        title: "Message required",
        description: "Please enter a message to test matching",
        variant: "destructive"
      });
      return;
    }

    const result = learningEngineService.findBestMatch(message, senderHint);
    setMatchResult(result);
  };

  const learnFromCurrentMessage = () => {
    if (!message) {
      toast({
        title: "Message required",
        description: "Please enter a message to learn from",
        variant: "destructive"
      });
      return;
    }

    try {
      learningEngineService.learnFromTransaction(message, dummyTransaction, senderHint);
      toast({
        title: "Learning success",
        description: "Message has been added to learning engine",
      });
    } catch (error) {
      toast({
        title: "Learning failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    }
  };

  const clearLearningEntries = () => {
    if (window.confirm("Are you sure you want to clear all learned entries? This action cannot be undone.")) {
      learningEngineService.clearLearnedEntries();
      toast({
        title: "Memory cleared",
        description: "All learned entries have been removed",
      });
      setMatchResult(null);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "bg-green-500";
    if (confidence >= 0.6) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="container max-w-4xl mx-auto py-8 space-y-6"
      >
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Learning Engine Tester</h1>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearLearningEntries}
              className="flex items-center gap-2 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              Clear Memory
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Test Message</CardTitle>
            <CardDescription>
              Paste a bank message to test the learning engine's matching capability
            </CardDescription>
          </CardHeader>
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
          <CardFooter>
            <Button onClick={findBestMatch} className="w-full">Test Matching</Button>
          </CardFooter>
        </Card>

        {matchResult && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Match Result</CardTitle>
                <Badge variant={matchResult.matched ? "default" : "outline"} className="ml-2">
                  {matchResult.matched ? "Match Found" : "No Match"}
                </Badge>
              </div>
              <CardDescription>
                Confidence Score: 
                <div className="w-full bg-muted rounded-full h-2 mt-1">
                  <div 
                    className={`h-2 rounded-full ${getConfidenceColor(matchResult.confidence)}`} 
                    style={{ width: `${matchResult.confidence * 100}%` }} 
                  />
                </div>
                <span className="ml-2">{(matchResult.confidence * 100).toFixed(1)}%</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {matchResult.entry && (
                <>
                  <div className="space-y-2">
                    <h3 className="font-medium">Matched Entry</h3>
                    <div className="bg-muted p-3 rounded-md text-sm overflow-auto max-h-[150px]">
                      {matchResult.entry.rawMessage}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-medium">Extracted Fields</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Type</p>
                        <p className="font-medium">{matchResult.entry.confirmedFields.type}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Amount</p>
                        <p className="font-medium">{matchResult.entry.confirmedFields.amount}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Currency</p>
                        <p className="font-medium">{matchResult.entry.confirmedFields.currency}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Category</p>
                        <p className="font-medium">{matchResult.entry.confirmedFields.category}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Vendor/Description</p>
                        <p className="font-medium">{matchResult.entry.confirmedFields.vendor || "Not available"}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Account</p>
                        <p className="font-medium">{matchResult.entry.confirmedFields.account || "Not available"}</p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <button 
                  onClick={() => setIsJsonExpanded(!isJsonExpanded)}
                  className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  <FileText className="h-4 w-4 mr-1" />
                  Raw JSON Data
                  {isJsonExpanded ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
                </button>
                
                {isJsonExpanded && (
                  <pre className="bg-muted p-3 rounded-md text-xs overflow-auto max-h-[300px] whitespace-pre-wrap">
                    {JSON.stringify(matchResult, null, 2)}
                  </pre>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Learn New Entry</CardTitle>
            <CardDescription>
              Add the current message to the learning engine with custom transaction data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Amount</label>
                <Input
                  type="number"
                  placeholder="100.00"
                  value={dummyTransaction.amount || ''}
                  onChange={(e) => setDummyTransaction({
                    ...dummyTransaction,
                    amount: parseFloat(e.target.value) || 0
                  })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Currency</label>
                <Input
                  placeholder="USD"
                  value={dummyTransaction.currency}
                  onChange={(e) => setDummyTransaction({
                    ...dummyTransaction,
                    currency: e.target.value as SupportedCurrency
                  })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description/Vendor</label>
                <Input
                  placeholder="Coffee Shop"
                  value={dummyTransaction.description || ''}
                  onChange={(e) => setDummyTransaction({
                    ...dummyTransaction,
                    description: e.target.value
                  })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                <select
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 h-10 text-sm ring-offset-background file:border-0 file:bg-transparent placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={dummyTransaction.type}
                  onChange={(e) => setDummyTransaction({
                    ...dummyTransaction,
                    type: e.target.value as TransactionType
                  })}
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                  <option value="transfer">Transfer</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Input
                  placeholder="Food & Dining"
                  value={dummyTransaction.category}
                  onChange={(e) => setDummyTransaction({
                    ...dummyTransaction,
                    category: e.target.value
                  })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Account</label>
                <Input
                  placeholder="Main Account"
                  value={dummyTransaction.fromAccount || ''}
                  onChange={(e) => setDummyTransaction({
                    ...dummyTransaction,
                    fromAccount: e.target.value
                  })}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              variant="outline" 
              onClick={learnFromCurrentMessage}
              className="w-full"
            >
              Save as Learning Entry
            </Button>
          </CardFooter>
        </Card>

        <div className="bg-muted p-4 rounded-md flex items-center gap-2 text-sm">
          <AlertCircle className="h-4 w-4 text-muted-foreground" />
          <p className="text-muted-foreground">
            <strong>Developer Tool:</strong> Changes made here are saved to local storage and will affect the learning engine's behavior.
          </p>
        </div>
      </motion.div>
    </Layout>
  );
};

export default LearningTester;
