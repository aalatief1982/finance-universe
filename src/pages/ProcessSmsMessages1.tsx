
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronRight, Check, MessageSquare, AlertCircle, Brain, Sparkles } from 'lucide-react';
import { useTransactions } from '@/context/TransactionContext';
import { useUser } from '@/context/UserContext';
import { Transaction, TransactionType } from '@/types/transaction';
import { useLearningEngine } from '@/hooks/useLearningEngine';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

/**
 * ProcessSmsMessages component for processing SMS messages to extract transactions.
 * Displays a list of SMS messages and allows selecting which to process.
 * Integrates with the learning engine to identify and classify transactions.
 */
const ProcessSmsMessages = () => {
  const [mockMessages, setMockMessages] = useState<any[]>([]);
  const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [enableLearning, setEnableLearning] = useState(true);
  const [matchedMessages, setMatchedMessages] = useState<Record<string, { confidence: number; matched: boolean }>>({}); 
  const { addTransaction } = useTransactions();
  const { user } = useUser();
  const navigate = useNavigate();
  const { findBestMatch, learnFromTransaction, config } = useLearningEngine();

  console.log("[ProcessSmsMessages] Component initialized");

  /**
   * Loads mock SMS messages and checks for learned matches.
   * Filters messages based on user's selected SMS providers.
   */
  useEffect(() => {
    console.log("[ProcessSmsMessages] Loading mock messages");
    // Mock SMS messages for demonstration
    const initialMessages = [
      { id: '1', sender: 'Bank of America', message: 'You spent $50 at The Coffee Shop on 03/15/2024.' },
      { id: '2', sender: 'Chase', message: 'Payment of $200 received from John Doe on 03/14/2024.' },
      { id: '3', sender: 'Citibank', message: 'Purchase of $75 at Amazon.com on 03/13/2024.' },
    ];

    console.log("[ProcessSmsMessages] User SMS providers:", user?.smsProviders);
    // Filter messages by selected providers if any
    const filteredMessages = user?.smsProviders?.length
      ? initialMessages.filter(msg => user.smsProviders?.some(provider =>
        msg.sender.toLowerCase().includes(provider.toLowerCase()) ||
        msg.message.toLowerCase().includes(provider.toLowerCase())
      ))
      : initialMessages;

    console.log("[ProcessSmsMessages] Filtered messages:", filteredMessages.length);
    setMockMessages(filteredMessages);
    
    // Check for learned matches
    console.log("[ProcessSmsMessages] Checking for learned matches");
    const matches: Record<string, { confidence: number; matched: boolean }> = {};
    
    filteredMessages.forEach(msg => {
      const matchResult = findBestMatch(msg.message, msg.sender);
      console.log("[ProcessSmsMessages] Match result for message:", { 
        id: msg.id, 
        confidence: matchResult.confidence, 
        matched: matchResult.matched
      });
      
      if (matchResult.confidence > 0) {
        matches[msg.id] = { 
          confidence: matchResult.confidence,
          matched: matchResult.matched
        };
      }
    });
    
    setMatchedMessages(matches);
  }, [user, findBestMatch]);

  /**
   * Toggles message selection in the list.
   * Adds or removes the message ID from the selected list.
   */
  const toggleMessage = (id: string) => {
    console.log("[ProcessSmsMessages] Toggling message selection:", id);
    setSelectedMessages(prev =>
      prev.includes(id)
        ? prev.filter(msgId => msgId !== id)
        : [...prev, id]
    );
  };

  /**
   * Handles importing selected SMS messages as transactions.
   * Processes messages and creates transaction objects.
   */
  const handleImport = () => {
    console.log("[ProcessSmsMessages] Importing selected messages:", selectedMessages.length);
    setIsProcessing(true);

    // Process each selected message
    const selectedMsgs = mockMessages.filter(msg => selectedMessages.includes(msg.id));
    console.log("[ProcessSmsMessages] Messages to process:", selectedMsgs.length);
    
    // Simulate processing and transaction creation
    setTimeout(() => {
      const extractedTransactions = selectedMsgs.map(message => {
        console.log("[ProcessSmsMessages] Processing message:", message.id);
        let transaction: Transaction;
        
        // Check if we have a learned match
        const matchInfo = matchedMessages[message.id];
        console.log("[ProcessSmsMessages] Match info for message:", { 
          id: message.id, 
          matchInfo 
        });
        
        if (matchInfo?.matched) {
          // Use the learned match
          console.log("[ProcessSmsMessages] Using learned match");
          const matchResult = findBestMatch(message.message, message.sender);
          
          if (matchResult.entry) {
            console.log("[ProcessSmsMessages] Match entry found:", matchResult.entry);
            const fields = matchResult.entry.confirmedFields;
            
            transaction = {
              id: `sms-${Math.random().toString(36).substring(2, 9)}`,
              title: fields.account || `SMS from ${message.sender}`,
              amount: fields.amount,
              category: fields.category,
              subcategory: fields.subcategory,
              date: new Date().toISOString().split('T')[0],
              type: fields.type,
              notes: `Smart match: ${message.message.substring(0, 100)}`,
              source: 'sms',
              fromAccount: fields.account,
              person: fields.person,
              currency: fields.currency,
            } as Transaction;
          } else {
            // Fallback to basic extraction
            console.log("[ProcessSmsMessages] Match entry not found, using basic extraction");
            transaction = createBasicTransaction(message);
          }
        } else {
          // Basic extraction logic
          console.log("[ProcessSmsMessages] No learned match, using basic extraction");
          transaction = createBasicTransaction(message);
        }

        console.log("[ProcessSmsMessages] Created transaction:", transaction);
        return transaction;
      });

      console.log("[ProcessSmsMessages] All transactions extracted:", extractedTransactions.length);

      // Add transactions to context
      extractedTransactions.forEach(transaction => {
        console.log("[ProcessSmsMessages] Adding transaction to context:", transaction.id);
        addTransaction(transaction);
        
        // Learn from this transaction if enabled
        if (config.enabled && enableLearning) {
          console.log("[ProcessSmsMessages] Learning from transaction:", {
            id: transaction.id,
            learning: enableLearning
          });
          
          const message = selectedMsgs.find(msg => 
            transaction.notes?.includes(msg.message.substring(0, 20))
          );
          
          if (message) {
            console.log("[ProcessSmsMessages] Learning from message:", message.id);
            learnFromTransaction(message.message, transaction, message.sender);
          }
        }
      });

      setIsProcessing(false);
      console.log("[ProcessSmsMessages] Processing complete, navigating to transactions page");
      navigate('/transactions'); // Redirect to transactions page
    }, 2000);
  };
  
  /**
   * Creates a basic transaction from an SMS message.
   * Extracts transaction details using simple pattern matching.
   */
  const createBasicTransaction = (message: any): Transaction => {
    console.log("[ProcessSmsMessages] Creating basic transaction from message:", message.id);
    // Basic extraction logic (replace with your actual parsing logic)
    const extractedTitle = `SMS Transaction from ${message.sender}`;
    const extractedAmount = parseFloat(message.message.match(/\$(\d+\.?\d*)/)?.[1] || '0');
    const extractedCategory = 'Uncategorized';
    const extractedSubcategory = '';

    console.log("[ProcessSmsMessages] Extracted details:", {
      title: extractedTitle,
      amount: extractedAmount
    });

    // Ensure we use a valid TransactionType
    const typeValue: TransactionType = message.message.toLowerCase().includes('received') 
      ? 'income' 
      : 'expense';

    return {
      id: `sms-${Math.random().toString(36).substring(2, 9)}`,
      title: extractedTitle,
      amount: typeValue === 'expense' ? -Math.abs(extractedAmount) : Math.abs(extractedAmount),
      category: extractedCategory,
      subcategory: extractedSubcategory,
      date: new Date().toISOString().split('T')[0],
      type: typeValue,
      notes: message.message.substring(0, 100),
      source: 'sms',
      fromAccount: 'Main Account',
      toAccount: '',
      person: '',
      currency: 'USD',
      country: ''
    } as Transaction;
  };

  return (
    <Layout>
      <div className="container mx-auto py-[var(--page-padding-y)]">
        <Card>
          <CardHeader>
            <CardTitle>Import SMS</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockMessages.length > 0 ? (
                mockMessages.map(message => {
                  const matchInfo = matchedMessages[message.id];
                  const hasMatch = matchInfo?.matched;
                  
                  return (
                    <div
                      key={message.id}
                      className={`flex items-center justify-between p-4 border rounded-md cursor-pointer ${
                        selectedMessages.includes(message.id) 
                          ? hasMatch 
                            ? 'bg-yellow-50 dark:bg-yellow-900/20' 
                            : 'bg-blue-50 dark:bg-blue-900/20'
                          : ''
                      }`}
                      onClick={() => toggleMessage(message.id)}
                    >
                      <div className="flex items-center">
                        <div className={`w-5 h-5 rounded-full mr-3 flex items-center justify-center ${
                          selectedMessages.includes(message.id) 
                            ? hasMatch 
                              ? 'bg-yellow-500 text-white' 
                              : 'bg-blue-500 text-white' 
                            : 'border border-gray-400'
                        }`}>
                          {selectedMessages.includes(message.id) && <Check size={16} />}
                        </div>
                        <div>
                          <div className="font-semibold flex items-center">
                            {message.sender}
                            {hasMatch && (
                              <Badge variant="outline" className="ml-2 flex items-center gap-1">
                                <Sparkles className="h-3 w-3" />
                                <span>{Math.round(matchInfo.confidence * 100)}% match</span>
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">{message.message}</div>
                        </div>
                      </div>
                      <ChevronRight className="text-gray-400" />
                    </div>
                  )
                })
              ) : (
                <div className="flex items-center justify-center p-4 text-gray-500">
                  <MessageSquare className="mr-2" />
                  No SMS messages found.
                </div>
              )}

              {mockMessages.length > 0 && (
                <div className="flex items-center space-x-2 pt-2">
                  <Switch
                    id="enable-learning"
                    checked={enableLearning}
                    onCheckedChange={(checked) => {
                      console.log("[ProcessSmsMessages] Learning enabled:", checked);
                      setEnableLearning(checked);
                    }}
                    disabled={!config.enabled}
                  />
                  <Label htmlFor="enable-learning" className="text-sm flex items-center">
                    <Brain className="h-4 w-4 mr-1" />
                    {config.enabled 
                      ? 'Learn from these messages for future suggestions' 
                      : 'Learning engine is disabled in settings'}
                  </Label>
                </div>
              )}

              <Button
                onClick={handleImport}
                disabled={selectedMessages.length === 0 || isProcessing}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  `Import Selected Messages (${selectedMessages.length})`
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ProcessSmsMessages;
