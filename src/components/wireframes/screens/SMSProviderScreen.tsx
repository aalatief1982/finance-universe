
import React, { useState } from 'react';
import WireframeContainer from '../WireframeContainer';
import WireframeHeader from '../WireframeHeader';
import WireframeButton from '../WireframeButton';
import { Calendar, ChevronRight, Search, AlertTriangle, Check } from 'lucide-react';

interface UserData {
  name?: string;
  email?: string;
  phone?: string;
  smsProviders?: string[];
  smsStartDate?: string;
}

interface SMSProviderScreenProps {
  onNext: () => void;
  onComplete: (providers: string[], startDate?: string) => void;
  onSkip: () => void;
  userData: UserData;
  onUpdateUserData: (data: Partial<UserData>) => void;
}

const SMSProviderScreen = ({ onNext, onComplete, onSkip, userData, onUpdateUserData }: SMSProviderScreenProps) => {
  const [selectedProviders, setSelectedProviders] = useState<string[]>(userData?.smsProviders || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState<string>(userData?.smsStartDate || '');
  const [error, setError] = useState('');

  // Calculate today's date and 6 months ago
  const today = new Date();
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(today.getMonth() - 6);
  
  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  };

  const providers = [
    { id: "bank-abc", name: "Bank ABC", pattern: "Transaction alert: $AMOUNT at..." },
    { id: "credit-xyz", name: "Credit Card XYZ", pattern: "Your card was charged $AMOUNT..." },
    { id: "investment", name: "Investment Corp", pattern: "Portfolio update: $AMOUNT deposited..." },
    { id: "digital-wallet", name: "Digital Wallet", pattern: "Payment of $AMOUNT received..." },
    { id: "mobile-banking", name: "Mobile Banking", pattern: "You spent $AMOUNT at..." }
  ];

  const filteredProviders = providers.filter(provider => 
    provider.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleProvider = (providerId: string) => {
    setSelectedProviders(prev => 
      prev.includes(providerId) 
        ? prev.filter(id => id !== providerId)
        : [...prev, providerId]
    );
    
    // Clear any error message when user selects a provider
    if (error) setError('');
  };

  const handleContinue = () => {
    if (selectedProviders.length === 0) {
      setError('Please select at least one SMS provider');
      return;
    }
    
    // Save selected providers to userData
    const selectedProviderNames = selectedProviders.map(id => 
      providers.find(p => p.id === id)?.name
    ).filter(Boolean) as string[];
    
    // Update user data with providers and start date
    const dataToUpdate: Partial<UserData> = {
      smsProviders: selectedProviderNames,
      smsStartDate: startDate || undefined
    };
    
    onUpdateUserData(dataToUpdate);
    onComplete(selectedProviderNames, startDate);
  };

  // Handle date selection
  const handleDateSelect = () => {
    // For wireframe purposes, set to six months ago
    const date = formatDate(sixMonthsAgo);
    setStartDate(date);
  };

  return (
    <WireframeContainer>
      <WireframeHeader title="Select SMS Providers" />
      <div className="p-4 space-y-4">
        <p className="text-sm text-gray-600 mb-2">
          Choose financial institutions that send you transaction SMS alerts.
          We'll scan messages from these providers to track your expenses.
        </p>
      
        <div className="relative mb-4">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search SMS Contacts" 
            className="w-full p-2 pl-8 border rounded-lg"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-2 mb-2 flex items-center text-red-700">
            <AlertTriangle className="mr-2 text-red-500" size={16} />
            <span className="text-sm">{error}</span>
          </div>
        )}
        
        <div className="max-h-64 overflow-y-auto space-y-2">
          {filteredProviders.length > 0 ? (
            filteredProviders.map(provider => (
              <div 
                key={provider.id} 
                className={`p-3 border rounded-lg flex items-center justify-between cursor-pointer transition ${
                  selectedProviders.includes(provider.id) 
                    ? 'bg-blue-50 border-blue-300' 
                    : 'bg-white hover:bg-gray-50'
                }`}
                onClick={() => toggleProvider(provider.id)}
              >
                <div className="flex items-center">
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3 ${
                    selectedProviders.includes(provider.id)
                      ? 'bg-blue-500 border-blue-500'
                      : 'border-gray-300'
                  }`}>
                    {selectedProviders.includes(provider.id) && <Check size={12} className="text-white" />}
                  </div>
                  <div>
                    <span className="font-medium">{provider.name}</span>
                    <p className="text-xs text-gray-500 mt-1">{provider.pattern}</p>
                  </div>
                </div>
                {selectedProviders.includes(provider.id) && (
                  <ChevronRight className="text-blue-600" size={20} />
                )}
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 py-4">
              No providers found
            </div>
          )}
        </div>
        
        <div className="mt-4 space-y-2">
          <label className="block text-gray-700 text-sm font-medium">Select Start Date</label>
          <div 
            className={`flex items-center border rounded-lg p-3 cursor-pointer hover:bg-gray-50 ${
              startDate ? 'border-blue-300 bg-blue-50' : ''
            }`}
            onClick={handleDateSelect}
          >
            <Calendar className={`mr-2 ${startDate ? 'text-blue-500' : 'text-gray-500'}`} size={20} />
            <span className={startDate ? 'text-blue-700' : 'text-gray-700'}>
              {startDate || `Choose Date (Up to 6 months: ${formatDate(sixMonthsAgo)})`}
            </span>
          </div>
          
          <p className="text-xs text-gray-500 mt-1">
            We'll analyze messages from this date forward. For privacy, we only access financial SMS.
          </p>
        </div>
        
        <div className="flex space-x-2 mt-4">
          <WireframeButton 
            onClick={handleContinue}
            variant="primary"
            disabled={selectedProviders.length === 0}
            className="flex-1"
          >
            Continue
          </WireframeButton>
          
          <WireframeButton 
            onClick={onSkip}
            variant="secondary"
          >
            Skip
          </WireframeButton>
        </div>
      </div>
    </WireframeContainer>
  );
};

export default SMSProviderScreen;
