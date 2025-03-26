
import React, { useState } from 'react';
import WireframeContainer from '../WireframeContainer';
import WireframeHeader from '../WireframeHeader';
import WireframeButton from '../WireframeButton';
import { Calendar, ChevronRight, Search, AlertTriangle } from 'lucide-react';

interface UserData {
  name?: string;
  email?: string;
  phone?: string;
  smsProviders?: string[];
}

interface SMSProviderScreenProps {
  onNext: () => void;
  onComplete: (providers: string[]) => void;
  onSkip: () => void;
  userData: UserData;
  onUpdateUserData: (data: Partial<UserData>) => void;
}

const SMSProviderScreen = ({ onNext, onComplete, onSkip, userData, onUpdateUserData }: SMSProviderScreenProps) => {
  const [selectedProviders, setSelectedProviders] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState<string>('');
  const [error, setError] = useState('');

  const providers = [
    { id: 1, name: "Bank ABC", pattern: "Transaction alert: $AMOUNT at..." },
    { id: 2, name: "Credit Card XYZ", pattern: "Your card was charged $AMOUNT..." },
    { id: 3, name: "Investment Corp", pattern: "Portfolio update: $AMOUNT deposited..." },
    { id: 4, name: "Digital Wallet", pattern: "Payment of $AMOUNT received..." },
    { id: 5, name: "Mobile Banking", pattern: "You spent $AMOUNT at..." }
  ];

  const filteredProviders = providers.filter(provider => 
    provider.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleProvider = (providerId: number) => {
    setSelectedProviders(prev => 
      prev.includes(providerId) 
        ? prev.filter(id => id !== providerId)
        : [...prev, providerId]
    );
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
    
    onUpdateUserData({ smsProviders: selectedProviderNames });
    onComplete(selectedProviderNames);
  };

  return (
    <WireframeContainer>
      <WireframeHeader title="Select SMS Providers" />
      <div className="space-y-2">
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
                className={`p-3 border rounded-lg flex items-center justify-between cursor-pointer hover:bg-blue-50 ${
                  selectedProviders.includes(provider.id) 
                    ? 'bg-blue-100 border-blue-300' 
                    : 'bg-white'
                }`}
                onClick={() => toggleProvider(provider.id)}
              >
                <div>
                  <span className="font-medium">{provider.name}</span>
                  <p className="text-xs text-gray-500 mt-1">{provider.pattern}</p>
                </div>
                {selectedProviders.includes(provider.id) && (
                  <ChevronRight className="text-blue-600" size={24} />
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
          <label className="block text-gray-700">Select Start Date</label>
          <div 
            className="flex items-center border rounded-lg p-2 cursor-pointer hover:bg-gray-50"
            onClick={() => setStartDate('2023-01-01')} // In real app, show date picker
          >
            <Calendar className="mr-2 text-gray-500" size={24} />
            <span>{startDate || 'Choose Date (Up to 6 months)'}</span>
          </div>
          
          <p className="text-xs text-gray-500 mt-1">
            We'll analyze messages from this date forward. For privacy, we only access financial SMS.
          </p>
        </div>
        
        <WireframeButton 
          onClick={handleContinue}
          variant={selectedProviders.length > 0 ? 'primary' : 'secondary'}
        >
          Continue
        </WireframeButton>
      </div>
    </WireframeContainer>
  );
};

export default SMSProviderScreen;
