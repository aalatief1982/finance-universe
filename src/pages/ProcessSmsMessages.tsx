import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronRight, Check, MessageSquare, AlertCircle } from 'lucide-react';
import { useTransactions } from '@/context/TransactionContext';
import { useUser } from '@/context/UserContext';
import { Transaction, TransactionType } from '@/types/transaction';

const ProcessSmsMessages = () => {
  const [mockMessages, setMockMessages] = useState<any[]>([]);
  const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { addTransaction } = useTransactions();
  const { user } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    // Mock SMS messages for demonstration
    const initialMessages = [
      { id: '1', sender: 'Bank of America', message: 'You spent $50 at The Coffee Shop on 03/15/2024.' },
      { id: '2', sender: 'Chase', message: 'Payment of $200 received from John Doe on 03/14/2024.' },
      { id: '3', sender: 'Citibank', message: 'Purchase of $75 at Amazon.com on 03/13/2024.' },
    ];

    // Filter messages by selected providers if any
    const filteredMessages = user?.smsProviders?.length
      ? initialMessages.filter(msg => user.smsProviders?.some(provider =>
        msg.sender.toLowerCase().includes(provider.toLowerCase()) ||
        msg.message.toLowerCase().includes(provider.toLowerCase())
      ))
      : initialMessages;

    setMockMessages(filteredMessages);
  }, [user]);

  const toggleMessage = (id: string) => {
    setSelectedMessages(prev =>
      prev.includes(id)
        ? prev.filter(msgId => msgId !== id)
        : [...prev, id]
    );
  };

  const handleImport = () => {
    setIsProcessing(true);

    // Simulate processing and transaction creation
    setTimeout(() => {
      const extractedTransactions = mockMessages.map(message => {
        // Basic extraction logic (replace with your actual parsing logic)
        const extractedTitle = `SMS Transaction from ${message.sender}`;
        const extractedAmount = parseFloat(message.message.match(/\$(\d+\.?\d*)/)?.[1] || '0');
        const extractedCategory = 'Uncategorized';
        const extractedSubcategory = '';

        // Ensure we use a valid TransactionType
        const typeValue: TransactionType = 'expense'; // or 'income' or 'transfer' based on your logic

        return {
          id: `sms-${Math.random().toString(36).substring(2, 9)}`,
          title: extractedTitle,
          amount: extractedAmount,
          category: extractedCategory,
          subcategory: extractedSubcategory,
          date: new Date().toISOString().split('T')[0],
          type: typeValue, // Use the typed variable
          notes: message.message.substring(0, 100),
          source: 'import',
          fromAccount: 'Main Account',
          toAccount: '',
          person: '',
          currency: 'USD',
          country: ''
        } as Transaction; // Cast to Transaction type
      });

      // Add transactions to context
      extractedTransactions.forEach(transaction => {
        addTransaction(transaction);
      });

      setIsProcessing(false);
      navigate('/transactions'); // Redirect to transactions page
    }, 2000);
  };

  return (
    <Layout>
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle>Process SMS Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockMessages.length > 0 ? (
                mockMessages.map(message => (
                  <div
                    key={message.id}
                    className={`flex items-center justify-between p-4 border rounded-md cursor-pointer ${selectedMessages.includes(message.id) ? 'bg-blue-50' : ''}`}
                    onClick={() => toggleMessage(message.id)}
                  >
                    <div className="flex items-center">
                      <div className={`w-5 h-5 rounded-full mr-3 flex items-center justify-center ${selectedMessages.includes(message.id) ? 'bg-blue-500 text-white' : 'border border-gray-400'}`}>
                        {selectedMessages.includes(message.id) && <Check size={16} />}
                      </div>
                      <div>
                        <div className="font-semibold">{message.sender}</div>
                        <div className="text-sm text-gray-500">{message.message}</div>
                      </div>
                    </div>
                    <ChevronRight className="text-gray-400" />
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center p-4 text-gray-500">
                  <MessageSquare className="mr-2" />
                  No SMS messages found.
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
