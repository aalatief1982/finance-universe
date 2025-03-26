
import React, { useState } from 'react';
import WireframeContainer from '../WireframeContainer';
import WireframeHeader from '../WireframeHeader';
import WireframeButton from '../WireframeButton';
import { Calendar, ChevronRight } from 'lucide-react';

interface SMSProviderScreenProps {
  onNext: () => void;
}

const SMSProviderScreen = ({ onNext }: SMSProviderScreenProps) => {
  const [selectedProviders, setSelectedProviders] = useState<number[]>([]);

  const providers = [
    { id: 1, name: "Bank ABC" },
    { id: 2, name: "Credit Card XYZ" },
    { id: 3, name: "Investment Corp" }
  ];

  const toggleProvider = (providerId: number) => {
    setSelectedProviders(prev => 
      prev.includes(providerId) 
        ? prev.filter(id => id !== providerId)
        : [...prev, providerId]
    );
  };

  return (
    <WireframeContainer>
      <WireframeHeader title="Select SMS Providers" />
      <div className="space-y-2">
        <input 
          type="text" 
          placeholder="Search SMS Contacts" 
          className="w-full p-2 border rounded-lg mb-4"
        />
        {providers.map(provider => (
          <div 
            key={provider.id} 
            className={`p-3 border rounded-lg flex items-center justify-between ${
              selectedProviders.includes(provider.id) 
                ? 'bg-blue-100 border-blue-300' 
                : 'bg-white'
            }`}
            onClick={() => toggleProvider(provider.id)}
          >
            <span>{provider.name}</span>
            {selectedProviders.includes(provider.id) && (
              <ChevronRight className="text-blue-600" size={24} />
            )}
          </div>
        ))}
        <div className="mt-4 space-y-2">
          <label className="block text-gray-700">Select Start Date</label>
          <div className="flex items-center border rounded-lg p-2">
            <Calendar className="mr-2 text-gray-500" size={24} />
            <span>Choose Date (Up to 6 months)</span>
          </div>
        </div>
        <WireframeButton onClick={onNext}>Continue</WireframeButton>
      </div>
    </WireframeContainer>
  );
};

export default SMSProviderScreen;
