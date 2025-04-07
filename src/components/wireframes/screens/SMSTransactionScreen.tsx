
import React, { useState, useEffect } from 'react';
import WireframeContainer from '../WireframeContainer';
import WireframeHeader from '../WireframeHeader';
import WireframeButton from '../WireframeButton';
import { useTransactions } from '@/context/TransactionContext';
import { useUser } from '@/context/UserContext';
import { Check, MessageSquare, XCircle, ChevronRight, Globe, DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { smsProviderSelectionService } from '@/services/SmsProviderSelectionService';
import { SmsMessage } from '@/services/NativeSmsService';
import { Capacitor } from '@capacitor/core';

interface SMSTransactionScreenProps {
  onComplete: () => void;
  onCancel: () => void;
}

const SMSTransactionScreen = ({ onComplete, onCancel }: SMSTransactionScreenProps) => {
  const [smsMessages, setSmsMessages] = useState<(SmsMessage & { id: string })[]>([]);
  const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { processTransactionsFromSMS } = useTransactions();
  const { user } = useUser();
  const [groupedMessages, setGroupedMessages] = useState<Record<string, any[]>>({});
  
  // Get SMS messages on mount
  useEffect(() => {
    const fetchSmsMessages = async () => {
      setIsLoading(true);
      
      try {
        // Get actual SMS messages from the device
        const messages = await smsProviderSelectionService.accessNativeSms();
        
        // Add unique IDs to messages
        const messagesWithIds = messages.map(msg => ({
          ...msg,
          id: Math.random().toString(36).substring(2, 15)
        }));
        
        // Group messages by provider/sender
        const grouped = messagesWithIds.reduce((groups: Record<string, any[]>, message) => {
          // Extract provider name - either use sender directly or try to extract from message
          const providerName = extractProviderName(message.address, message.body);
          
          if (!groups[providerName]) {
            groups[providerName] = [];
          }
          groups[providerName].push(message);
          return groups;
        }, {});
        
        setGroupedMessages(grouped);
        setSmsMessages(messagesWithIds);
      } catch (error) {
        console.error('Error fetching SMS messages:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSmsMessages();
  }, [user]);
  
  // Extract a readable provider name from sender or message
  const extractProviderName = (sender: string, message: string): string => {
    // Clean up sender name
    if (sender && !/^\+?\d+$/.test(sender)) {
      // If sender is not just a phone number, use it
      return sender.replace(/^sms from |^msg from |^alert: /i, '').trim();
    }
    
    // Try to extract from message content
    const bankKeywords = [
      // Saudi banks
      { name: 'Al Rajhi Bank', patterns: ['rajhi', 'الراجحي'] },
      { name: 'Saudi National Bank', patterns: ['snb', 'saudi national', 'البنك الأهلي'] },
      { name: 'Riyad Bank', patterns: ['riyad', 'بنك الرياض'] },
      
      // Egyptian banks
      { name: 'National Bank of Egypt', patterns: ['nbe', 'البنك الأهلي المصري'] },
      { name: 'Commercial International Bank', patterns: ['cib'] },
      
      // Indian banks
      { name: 'State Bank of India', patterns: ['sbi'] },
      { name: 'HDFC Bank', patterns: ['hdfc'] },
      
      // Payment services
      { name: 'STC Pay', patterns: ['stc pay', 'stcpay'] },
      { name: 'PayPal', patterns: ['paypal'] },
      
      // Generic
      { name: 'Bank', patterns: ['bank', 'بنك', 'مصرف'] },
      { name: 'Credit Card', patterns: ['card', 'credit', 'visa', 'mastercard'] }
    ];
    
    const messageLower = message.toLowerCase();
    
    for (const bank of bankKeywords) {
      for (const pattern of bank.patterns) {
        if (messageLower.includes(pattern.toLowerCase())) {
          return bank.name;
        }
      }
    }
    
    // If we can't determine a specific bank, return the sender or a generic label
    return sender || 'Bank Message';
  };
  
  // Detect the likely country from the message
  const detectCountry = (message: string): string | null => {
    const countryPatterns = [
      { country: 'Saudi Arabia', patterns: ['sar', 'riyal', 'ريال', 'سعودي'] },
      { country: 'Egypt', patterns: ['egp', 'egyptian pound', 'جنيه', 'مصري'] },
      { country: 'India', patterns: ['inr', 'rupee', 'rupees', 'rs.'] },
      { country: 'UAE', patterns: ['aed', 'dirham', 'دراهم'] }
    ];
    
    const messageLower = message.toLowerCase();
    
    for (const country of countryPatterns) {
      for (const pattern of country.patterns) {
        if (messageLower.includes(pattern)) {
          return country.country;
        }
      }
    }
    
    return null;
  };
  
  // Detect the currency from the message
  const detectCurrency = (message: string): string | null => {
    const currencyPatterns = [
      { currency: 'SAR', patterns: ['sar', 'riyal', 'ريال', 'sr', 'saudi riyal'] },
      { currency: 'EGP', patterns: ['egp', 'egyptian pound', 'جنيه', 'le'] },
      { currency: 'INR', patterns: ['inr', 'rupee', 'rupees', 'rs.', '₹'] },
      { currency: 'AED', patterns: ['aed', 'dirham', 'دراهم'] },
      { currency: 'USD', patterns: ['usd', '$', 'dollar'] },
      { currency: 'EUR', patterns: ['eur', '€', 'euro'] }
    ];
    
    const messageLower = message.toLowerCase();
    
    for (const currency of currencyPatterns) {
      for (const pattern of currency.patterns) {
        if (messageLower.includes(pattern)) {
          return currency.currency;
        }
      }
    }
    
    return null;
  };
  
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
        sender: msg.address,
        message: msg.body,
        date: new Date(msg.timestamp)
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
  
  // Get count of messages by provider group
  const getProviderMessageCount = (providerName: string): number => {
    return groupedMessages[providerName]?.length || 0;
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
          
          {/* Provider tabs */}
          {Object.keys(groupedMessages).length > 1 && (
            <div className="p-2 bg-gray-50 border-b flex items-center space-x-2 overflow-x-auto">
              {Object.keys(groupedMessages).map(provider => (
                <Badge
                  key={provider}
                  variant="outline"
                  className="px-3 py-1 cursor-pointer"
                >
                  {provider} ({getProviderMessageCount(provider)})
                </Badge>
              ))}
            </div>
          )}
          
          <div className="divide-y max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="p-6 text-center">
                <div className="w-12 h-12 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-gray-500">Loading SMS messages...</p>
              </div>
            ) : smsMessages.length > 0 ? (
              smsMessages.map(msg => {
                const country = detectCountry(msg.body);
                const currency = detectCurrency(msg.body);
                
                return (
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
                        <h4 className="font-medium text-sm">{msg.address}</h4>
                        <span className="text-xs text-gray-500">
                          {new Date(msg.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {msg.body}
                      </p>
                      
                      {/* Display country and currency if detected */}
                      <div className="flex mt-1.5 gap-2">
                        {country && (
                          <div className="inline-flex items-center text-xs bg-gray-100 text-gray-700 rounded-full px-2 py-0.5">
                            <Globe size={10} className="mr-1" />
                            {country}
                          </div>
                        )}
                        {currency && (
                          <div className="inline-flex items-center text-xs bg-gray-100 text-gray-700 rounded-full px-2 py-0.5">
                            <DollarSign size={10} className="mr-1" />
                            {currency}
                          </div>
                        )}
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-gray-400 ml-2 flex-shrink-0" />
                  </div>
                )
              })
            ) : (
              <div className="p-6 text-center">
                <p className="text-gray-500">
                  {Capacitor.isNativePlatform() 
                    ? "No SMS messages found. Make sure you've granted SMS permission and have selected providers." 
                    : "SMS import is only available on physical devices."}
                </p>
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
