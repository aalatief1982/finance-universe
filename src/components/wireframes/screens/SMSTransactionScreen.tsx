
import React, { useState, useEffect } from 'react';
import WireframeContainer from '../WireframeContainer';
import WireframeHeader from '../WireframeHeader';
import WireframeButton from '../WireframeButton';
import { useTransactions } from '@/context/TransactionContext';
import { useUser } from '@/context/UserContext';
import { Check, MessageSquare, XCircle, ChevronRight } from 'lucide-react';
import { getMockSmsMessages } from '@/lib/sms-parser';

interface SMSTransactionScreenProps {
  onComplete: () => void;
  onCancel: () => void;
}

const SMSTransactionScreen = ({ onComplete, onCancel }: SMSTransactionScreenProps) => {
  const [smsMessages, setSmsMessages] = useState<any[]>([]);
  const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { processTransactionsFromSMS } = useTransactions();
  const { user } = useUser();
  
  // Get SMS messages on mount
  useEffect(() => {
    // In a real app, this would request SMS messages from the device
    // For the wireframe, we'll use mock data
    const mockMessages = getMockSmsMessages();
    
    // Filter messages by selected providers if any
    const filteredMessages = user?.smsProviders?.length 
      ? mockMessages.filter(msg => user.smsProviders?.includes(msg.sender))
      : mockMessages;
      
    setSmsMessages(filteredMessages);
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
    
    // Get selected messages
    const messagesToProcess = smsMessages
      .filter(msg => selectedMessages.includes(msg.id))
      .map(msg => ({
        sender: msg.sender,
        message: msg.message,
        date: msg.date
      }));
    
    // Process messages to extract transactions
    processTransactionsFromSMS(messagesToProcess);
    
    // Complete the flow
    onComplete();
  };

  const handleSelectAll = () => {
    if (selectedMessages.length === smsMessages.length) {
      // Deselect all
      setSelectedMessages([]);
    } else {
      // Select all
      setSelectedMessages(smsMessages.map(msg => msg.id));
    }
  };
  
  return (
    <WireframeContainer>
      <WireframeHeader title="Import Transactions" />
      
      <div className="p-4 space-y-6">
        <div className="text-center mb-4">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <MessageSquare size={24} className="text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold">Import from SMS</h2>
          <p className="text-gray-600 text-sm mt-1">
            Select messages to import as transactions
          </p>
        </div>
        
        <div className="border rounded-lg overflow-hidden">
          <div className="p-3 bg-gray-50 border-b flex justify-between items-center">
            <span className="font-medium">SMS Messages</span>
            <button 
              className="text-sm text-blue-600"
              onClick={handleSelectAll}
            >
              {selectedMessages.length === smsMessages.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          
          <div className="divide-y max-h-80 overflow-y-auto">
            {smsMessages.length > 0 ? (
              smsMessages.map(msg => (
                <div 
                  key={msg.id}
                  className={`p-3 flex items-start ${
                    selectedMessages.includes(msg.id) ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => toggleMessage(msg.id)}
                >
                  <div className={`w-6 h-6 rounded-full border mr-3 flex-shrink-0 flex items-center justify-center ${
                    selectedMessages.includes(msg.id) 
                      ? 'bg-blue-500 border-blue-500' 
                      : 'border-gray-300'
                  }`}>
                    {selectedMessages.includes(msg.id) && (
                      <Check size={14} className="text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <h4 className="font-medium text-sm">{msg.sender}</h4>
                      <span className="text-xs text-gray-500">
                        {msg.date.toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {msg.message}
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-gray-400 ml-2 flex-shrink-0" />
                </div>
              ))
            ) : (
              <div className="p-6 text-center">
                <p className="text-gray-500">No SMS messages found</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex space-x-3">
          <WireframeButton 
            variant="primary" 
            className="flex-1"
            onClick={handleImport}
            disabled={selectedMessages.length === 0 || isProcessing}
          >
            {isProcessing ? 'Processing...' : `Import ${selectedMessages.length} Message${selectedMessages.length !== 1 ? 's' : ''}`}
          </WireframeButton>
          
          <WireframeButton 
            variant="secondary"
            onClick={onCancel}
            disabled={isProcessing}
          >
            Cancel
          </WireframeButton>
        </div>
      </div>
    </WireframeContainer>
  );
};

export default SMSTransactionScreen;
