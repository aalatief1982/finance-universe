
import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent 
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { learningEngineService } from '@/services/LearningEngineService';
import { MatchResult, LearnedEntry } from '@/types/learning';
import { Transaction, TransactionType } from '@/types/transaction';
import { SupportedCurrency } from '@/types/locale';
import { 
  AlertCircle,
  ChevronDown, 
  ChevronUp, 
  FileText, 
  Trash2,
  CircleDot,
  CircleCheck,
  CircleX,
  Info,
  Check,
  X,
  TableIcon,
  Pencil,
  Tag,
  RefreshCw,
  Save
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Token field types available for manual labeling
const TOKEN_FIELD_TYPES = [
  { value: 'amount', label: 'Amount', color: 'blue' },
  { value: 'currency', label: 'Currency', color: 'green' },
  { value: 'vendor', label: 'Vendor', color: 'orange' },
  { value: 'account', label: 'Account', color: 'purple' },
  { value: 'unlabeled', label: 'Unlabeled', color: 'gray' },
  { value: 'ignore', label: 'Ignore', color: 'red' }
];

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
    title: '',
    source: 'manual'
  });
  
  // For token labeling functionality
  const [isLabelingMode, setIsLabelingMode] = useState(false);
  const [tokenLabels, setTokenLabels] = useState<Record<string, string>>({});
  const [manualFieldTokenMap, setManualFieldTokenMap] = useState<Record<string, string[]>>({
    amount: [],
    currency: [],
    vendor: [],
    account: []
  });
  const [labelingHistory, setLabelingHistory] = useState<Array<Record<string, string>>>([]);
  
  const { toast } = useToast();

  // Generate tokens from the current message
  const messageTokens = useMemo(() => {
    if (!message) return [];
    return learningEngineService.tokenize ? 
      learningEngineService.tokenize(message) : 
      message.toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/).filter(Boolean);
  }, [message]);

  // Initial automatic tokenization
  useEffect(() => {
    if (message && !isLabelingMode) {
      const tokenMap = {
        amount: learningEngineService.extractAmountTokens(message),
        currency: learningEngineService.extractCurrencyTokens(message),
        vendor: learningEngineService.extractVendorTokens(message),
        account: learningEngineService.extractAccountTokens(message)
      };
      setManualFieldTokenMap(tokenMap);
      
      // Create initial token labels
      const initialLabels: Record<string, string> = {};
      messageTokens.forEach(token => {
        for (const [field, tokens] of Object.entries(tokenMap)) {
          if (tokens.includes(token)) {
            initialLabels[token] = field;
            break;
          }
        }
        if (!initialLabels[token]) {
          initialLabels[token] = 'unlabeled';
        }
      });
      setTokenLabels(initialLabels);
    }
  }, [message, messageTokens, isLabelingMode]);

  // Check if a token exists in any field token map
  const getTokenFieldMatch = (token: string) => {
    if (!matchResult?.entry?.fieldTokenMap) return null;
    
    const fieldMap = matchResult.entry.fieldTokenMap;
    for (const [field, tokens] of Object.entries(fieldMap)) {
      if (tokens.includes(token)) {
        return field;
      }
    }
    return null;
  };

  // Get the token match status and return appropriate styling
  const getTokenStyle = (token: string) => {
    if (isLabelingMode) {
      const labelType = tokenLabels[token] || 'unlabeled';
      const fieldType = TOKEN_FIELD_TYPES.find(t => t.value === labelType);
      
      const fieldColors: Record<string, string> = {
        amount: "bg-blue-100 text-blue-800 border-blue-300",
        currency: "bg-green-100 text-green-800 border-green-300",
        vendor: "bg-orange-100 text-orange-800 border-orange-300",
        account: "bg-purple-100 text-purple-800 border-purple-300",
        unlabeled: "bg-muted text-muted-foreground",
        ignore: "bg-red-100 text-red-800 border-red-300"
      };
      
      return {
        className: fieldColors[labelType] || "bg-muted text-muted-foreground",
        icon: labelType !== 'unlabeled' ? <Tag className="h-3 w-3 mr-1" /> : <CircleDot className="h-3 w-3 mr-1" />,
        field: labelType !== 'unlabeled' ? labelType : null
      };
    }
    
    const fieldMatch = getTokenFieldMatch(token);
    
    if (!fieldMatch) {
      return {
        className: "bg-muted text-muted-foreground",
        icon: <CircleDot className="h-3 w-3 mr-1" />
      };
    }
    
    // Color coding based on field type
    const fieldColors: Record<string, string> = {
      amount: "bg-blue-100 text-blue-800 border-blue-300",
      currency: "bg-green-100 text-green-800 border-green-300",
      vendor: "bg-orange-100 text-orange-800 border-orange-300",
      account: "bg-purple-100 text-purple-800 border-purple-300"
    };
    
    return {
      className: fieldColors[fieldMatch] || "bg-primary/20 text-primary border-primary/30",
      icon: <CircleCheck className="h-3 w-3 mr-1" />,
      field: fieldMatch
    };
  };

  // Calculate confidence breakdown details
  const confidenceBreakdown = useMemo(() => {
    if (isLabelingMode) {
      // Create a field map from the manual labels
      const labelFieldMap: Record<string, string[]> = {
        amount: [],
        currency: [],
        vendor: [],
        account: []
      };
      
      // Group tokens by their label
      Object.entries(tokenLabels).forEach(([token, label]) => {
        if (label && label !== 'unlabeled' && label !== 'ignore' && labelFieldMap[label]) {
          labelFieldMap[label].push(token);
        }
      });
      
      const totalFields = Object.keys(labelFieldMap).filter(
        key => labelFieldMap[key].length > 0
      ).length;
      
      // Total tokens with meaningful labels
      const labeledTokenCount = Object.values(tokenLabels)
        .filter(label => label && label !== 'unlabeled' && label !== 'ignore')
        .length;
      
      // Estimate sender hint bonus (simplified calculation)
      const senderBonus = senderHint ? 0.1 : 0;
        
      return {
        matchedFields: totalFields,
        totalFields: Object.keys(labelFieldMap).length,
        tokenOverlapCount: labeledTokenCount,
        senderBonus,
        calculatedScore: (totalFields ? totalFields / Object.keys(labelFieldMap).length : 0) + senderBonus
      };
    }
    
    if (!matchResult?.entry) return null;
    
    const fieldMap = matchResult.entry.fieldTokenMap;
    const totalFields = Object.keys(fieldMap).length;
    const matchedFields = Object.entries(fieldMap).filter(([_, tokens]) => 
      tokens.some(token => messageTokens.includes(token))
    ).length;
    
    // Count total token overlaps
    let tokenOverlapCount = 0;
    Object.values(fieldMap).forEach(fieldTokens => {
      fieldTokens.forEach(token => {
        if (messageTokens.includes(token)) tokenOverlapCount++;
      });
    });
    
    // Estimate sender hint bonus (simplified calculation)
    const senderBonus = 
      senderHint && 
      matchResult.entry.senderHint?.toLowerCase().includes(senderHint.toLowerCase())
        ? 0.1
        : 0;
        
    return {
      matchedFields,
      totalFields,
      tokenOverlapCount,
      senderBonus,
      calculatedScore: (totalFields ? matchedFields / totalFields : 0) + senderBonus
    };
  }, [matchResult, messageTokens, senderHint, isLabelingMode, tokenLabels]);

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

  const toggleLabelingMode = () => {
    if (!isLabelingMode) {
      // Entering labeling mode, save current state for undo
      setLabelingHistory([{ ...tokenLabels }]);
    }
    setIsLabelingMode(!isLabelingMode);
  };

  const handleTokenLabelChange = (token: string, newLabel: string) => {
    // Save current state for undo
    setLabelingHistory([...labelingHistory, { ...tokenLabels }]);
    
    // Update the token label
    const updatedLabels = { ...tokenLabels, [token]: newLabel };
    setTokenLabels(updatedLabels);
    
    // Update the manual field token map
    const updatedFieldTokenMap = {
      amount: [],
      currency: [],
      vendor: [],
      account: []
    };
    
    Object.entries(updatedLabels).forEach(([token, label]) => {
      if (label !== 'unlabeled' && label !== 'ignore' && updatedFieldTokenMap[label]) {
        updatedFieldTokenMap[label].push(token);
      }
    });
    
    setManualFieldTokenMap(updatedFieldTokenMap);
  };

  const clearAllLabels = () => {
    // Save current state for undo
    setLabelingHistory([...labelingHistory, { ...tokenLabels }]);
    
    // Reset all tokens to unlabeled
    const clearedLabels: Record<string, string> = {};
    messageTokens.forEach(token => {
      clearedLabels[token] = 'unlabeled';
    });
    
    setTokenLabels(clearedLabels);
    setManualFieldTokenMap({
      amount: [],
      currency: [],
      vendor: [],
      account: []
    });
  };

  const undoLastLabeling = () => {
    if (labelingHistory.length > 0) {
      const previousState = labelingHistory.pop();
      if (previousState) {
        setTokenLabels(previousState);
        
        // Reconstruct field token map from previous token labels
        const reconstructedMap = {
          amount: [],
          currency: [],
          vendor: [],
          account: []
        };
        
        Object.entries(previousState).forEach(([token, label]) => {
          if (label !== 'unlabeled' && label !== 'ignore' && reconstructedMap[label]) {
            reconstructedMap[label].push(token);
          }
        });
        
        setManualFieldTokenMap(reconstructedMap);
      }
      setLabelingHistory([...labelingHistory]);
    }
  };

  const applyAutomaticLabels = () => {
    if (!message) return;
    
    // Save current state for undo
    setLabelingHistory([...labelingHistory, { ...tokenLabels }]);
    
    const tokenMap = {
      amount: learningEngineService.extractAmountTokens(message),
      currency: learningEngineService.extractCurrencyTokens(message),
      vendor: learningEngineService.extractVendorTokens(message),
      account: learningEngineService.extractAccountTokens(message)
    };
    
    // Create initial token labels
    const autoLabels: Record<string, string> = {};
    messageTokens.forEach(token => {
      let found = false;
      for (const [field, tokens] of Object.entries(tokenMap)) {
        if (tokens.includes(token)) {
          autoLabels[token] = field;
          found = true;
          break;
        }
      }
      if (!found) {
        autoLabels[token] = 'unlabeled';
      }
    });
    
    setTokenLabels(autoLabels);
    setManualFieldTokenMap(tokenMap);
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
      // If in labeling mode, use the manual field token map
      if (isLabelingMode) {
        learningEngineService.learnFromTransaction(message, dummyTransaction, senderHint, manualFieldTokenMap);
      } else {
        learningEngineService.learnFromTransaction(message, dummyTransaction, senderHint);
      }
      
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
          <CardFooter className="flex justify-between">
            <Button onClick={findBestMatch} className="flex-1 mr-2">Test Matching</Button>
            <Button 
              variant={isLabelingMode ? "secondary" : "outline"} 
              onClick={toggleLabelingMode}
              className="flex items-center gap-1"
            >
              <Pencil className="h-4 w-4" />
              {isLabelingMode ? "Exit Labeling Mode" : "Enter Labeling Mode"}
            </Button>
          </CardFooter>
        </Card>

        {(matchResult || (isLabelingMode && messageTokens.length > 0)) && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    {isLabelingMode ? "Token Labeling Mode" : "Match Result"}
                  </CardTitle>
                  {!isLabelingMode && matchResult && (
                    <Badge variant={matchResult.matched ? "default" : "outline"} className="ml-2">
                      {matchResult.matched ? "Match Found" : "No Match"}
                    </Badge>
                  )}
                </div>
                <CardDescription>
                  {isLabelingMode ? (
                    <div className="flex items-center justify-between mt-2">
                      <span>Manually assign field types to tokens</span>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={clearAllLabels}
                          className="flex items-center gap-1 text-xs"
                        >
                          <X className="h-3 w-3" />
                          Clear All
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={undoLastLabeling}
                          disabled={labelingHistory.length === 0}
                          className="flex items-center gap-1 text-xs"
                        >
                          <ChevronUp className="h-3 w-3" />
                          Undo
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={applyAutomaticLabels}
                          className="flex items-center gap-1 text-xs"
                        >
                          <RefreshCw className="h-3 w-3" />
                          Auto-detect
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      Confidence Score: 
                      <div className="w-full bg-muted rounded-full h-2 mt-1">
                        <div 
                          className={`h-2 rounded-full ${getConfidenceColor(matchResult?.confidence || 0)}`} 
                          style={{ width: `${(matchResult?.confidence || 0) * 100}%` }} 
                        />
                      </div>
                      <span className="ml-2">{((matchResult?.confidence || 0) * 100).toFixed(1)}%</span>
                    </>
                  )}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Token Visualization */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium flex items-center">
                    {isLabelingMode ? (
                      <>
                        <Tag className="h-4 w-4 mr-1" />
                        Token Labeling
                      </>
                    ) : (
                      <>
                        <CircleDot className="h-4 w-4 mr-1" />
                        Token Analysis
                      </>
                    )}
                  </h3>
                  <div className="flex flex-wrap gap-2 p-3 bg-muted/30 rounded-md">
                    {messageTokens.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic">No tokens found in message</p>
                    ) : (
                      messageTokens.map((token, index) => {
                        const style = getTokenStyle(token);
                        return isLabelingMode ? (
                          <DropdownMenu key={`${token}-${index}`}>
                            <DropdownMenuTrigger asChild>
                              <Badge 
                                variant="outline" 
                                className={`flex items-center gap-1 cursor-pointer ${style.className} border hover:bg-muted/50`}
                              >
                                {style.icon}
                                {token}
                                {style.field && (
                                  <span className="ml-1 text-[9px] px-1 bg-background/50 rounded">
                                    {style.field}
                                  </span>
                                )}
                              </Badge>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-40">
                              {TOKEN_FIELD_TYPES.map((type) => (
                                <DropdownMenuItem 
                                  key={type.value}
                                  className={`text-sm flex items-center gap-2 ${
                                    tokenLabels[token] === type.value ? 'bg-muted/60' : ''
                                  }`}
                                  onClick={() => handleTokenLabelChange(token, type.value)}
                                >
                                  <div className={`w-2 h-2 rounded-full bg-${type.color}-500`} />
                                  {type.label}
                                  {tokenLabels[token] === type.value && (
                                    <Check className="h-3 w-3 ml-auto" />
                                  )}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
                          <Badge 
                            key={`${token}-${index}`} 
                            variant="outline" 
                            className={`flex items-center gap-1 ${style.className} border`}
                          >
                            {style.icon}
                            {token}
                            {style.field && (
                              <span className="ml-1 text-[9px] px-1 bg-background/50 rounded">
                                {style.field}
                              </span>
                            )}
                          </Badge>
                        );
                      })
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <div className="flex items-center">
                      <CircleDot className="h-3 w-3 mr-1 text-muted-foreground" />
                      <span className="text-muted-foreground">Unmatched</span>
                    </div>
                    <div className="flex items-center">
                      <CircleCheck className="h-3 w-3 mr-1 text-blue-600" />
                      <span className="text-blue-600">amount</span>
                    </div>
                    <div className="flex items-center">
                      <CircleCheck className="h-3 w-3 mr-1 text-green-600" />
                      <span className="text-green-600">currency</span>
                    </div>
                    <div className="flex items-center">
                      <CircleCheck className="h-3 w-3 mr-1 text-orange-600" />
                      <span className="text-orange-600">vendor</span>
                    </div>
                    <div className="flex items-center">
                      <CircleCheck className="h-3 w-3 mr-1 text-purple-600" />
                      <span className="text-purple-600">account</span>
                    </div>
                    {isLabelingMode && (
                      <div className="flex items-center">
                        <CircleX className="h-3 w-3 mr-1 text-red-600" />
                        <span className="text-red-600">ignore</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Confidence Breakdown */}
                {confidenceBreakdown && (
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
                )}

                {/* Field Token Map Table */}
                {(isLabelingMode || matchResult?.entry) && (
                  <Tabs defaultValue={isLabelingMode ? "fieldmap" : "fieldmap"} className="w-full">
                    <TabsList className="w-full grid grid-cols-3">
                      <TabsTrigger value="fieldmap">Field Token Map</TabsTrigger>
                      {!isLabelingMode && <TabsTrigger value="entry">Entry Details</TabsTrigger>}
                      {!isLabelingMode && <TabsTrigger value="json">JSON Data</TabsTrigger>}
                      {isLabelingMode && <TabsTrigger value="preview">Transaction Preview</TabsTrigger>}
                      {isLabelingMode && <TabsTrigger value="learning">Learning Settings</TabsTrigger>}
                    </TabsList>
                    
                    <TabsContent value="fieldmap" className="space-y-4 mt-4">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Field</TableHead>
                            <TableHead>Tokens</TableHead>
                            <TableHead className="text-right">Found</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Object.entries(isLabelingMode ? manualFieldTokenMap : matchResult?.entry?.fieldTokenMap || {}).map(([field, tokens]) => {
                            const found = tokens.some(token => messageTokens.includes(token));
                            return (
                              <TableRow key={field}>
                                <TableCell className="font-medium">{field}</TableCell>
                                <TableCell>
                                  <div className="flex flex-wrap gap-1">
                                    {tokens.map((token, i) => (
                                      <Badge 
                                        key={`${field}-${token}-${i}`} 
                                        variant="outline"
                                        className={`text-xs ${messageTokens.includes(token) ? 'bg-primary/20 border-primary/30' : 'bg-muted'}`}
                                      >
                                        {token}
                                      </Badge>
                                    ))}
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  {found ? 
                                    <Check className="ml-auto h-4 w-4 text-green-600" /> : 
                                    <X className="ml-auto h-4 w-4 text-muted-foreground" />
                                  }
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TabsContent>
                    
                    {!isLabelingMode && (
                      <TabsContent value="entry" className="space-y-4 mt-4">
                        <Accordion type="single" collapsible className="w-full">
                          <AccordionItem value="original-message">
                            <AccordionTrigger className="text-sm font-medium">
                              Original Learned Message
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="bg-muted p-3 rounded-md text-sm whitespace-pre-wrap overflow-auto max-h-[150px]">
                                {matchResult?.entry?.rawMessage}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                          
                          <AccordionItem value="confirmed-fields">
                            <AccordionTrigger className="text-sm font-medium">
                              Confirmed Fields
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="grid grid-cols-2 gap-2 rounded-md">
                                {matchResult?.entry?.confirmedFields && Object.entries(matchResult.entry.confirmedFields).map(([key, value]) => (
                                  <div key={key} className="bg-muted p-2 rounded">
                                    <div className="text-xs text-muted-foreground">{key}</div>
                                    <div className="font-medium">{value !== undefined ? String(value) : "N/A"}</div>
                                  </div>
                                ))}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </TabsContent>
                    )}
                    
                    {!isLabelingMode && (
                      <TabsContent value="json" className="space-y-4 mt-4">
                        <div className="bg-muted p-3 rounded-md">
                          <pre className="text-xs overflow-auto max-h-[300px] whitespace-pre-wrap">
                            {JSON.stringify(matchResult?.entry, null, 2)}
                          </pre>
                        </div>
                      </TabsContent>
                    )}
                    
                    {isLabelingMode && (
                      <TabsContent value="preview" className="space-y-4 mt-4">
                        <div className="bg-muted/30 p-4 rounded-md">
                          <h3 className="text-sm font-medium mb-3">Transaction Preview</h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">Type</div>
                              <div className="font-medium">{dummyTransaction.type}</div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">Amount</div>
                              <div className="font-medium">{dummyTransaction.amount}</div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">Currency</div>
                              <div className="font-medium">{dummyTransaction.currency}</div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">Category</div>
                              <div className="font-medium">{dummyTransaction.category}</div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">Description/Vendor</div>
                              <div className="font-medium">{dummyTransaction.description || '(None)'}</div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">Account</div>
                              <div className="font-medium">{dummyTransaction.fromAccount || '(None)'}</div>
                            </div>
                          </div>
                        </div>
                      </TabsContent>
                    )}
                    
                    {isLabelingMode && (
                      <TabsContent value="learning" className="space-y-4 mt-4">
                        <div className="p-4 rounded-md border">
                          <h3 className="text-sm font-medium mb-4">Transaction Data</h3>
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
                        </div>
                      </TabsContent>
                    )}
                  </Tabs>
                )}
              </CardContent>
            </Card>

            {!isLabelingMode && (
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
            )}
            
            {isLabelingMode && (
              <Button 
                onClick={learnFromCurrentMessage}
                className="w-full flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                Save Labeled Entry to Learning Engine
              </Button>
            )}
          </div>
        )}

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
