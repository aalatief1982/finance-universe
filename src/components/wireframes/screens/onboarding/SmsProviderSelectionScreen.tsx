
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, MessageSquare } from 'lucide-react';
import WireframeButton from '../../WireframeButton';

interface SmsProviderSelectionScreenProps {
  onComplete: (selectedProviders: string[]) => void;
}

const smsProviders = [
  {
    id: 'bank-of-america',
    name: 'Bank of America',
    icon: '🏦',
    description: 'Transaction alerts from Bank of America'
  },
  {
    id: 'chase',
    name: 'Chase Bank',
    icon: '💳',
    description: 'Purchase notifications and alerts'
  },
  {
    id: 'wells-fargo',
    name: 'Wells Fargo',
    icon: '🏛️',
    description: 'Account activity alerts'
  },
  {
    id: 'citibank',
    name: 'Citibank',
    icon: '💰',
    description: 'Transaction notifications'
  },
  {
    id: 'capital-one',
    name: 'Capital One',
    icon: '💵',
    description: 'Purchase and payment alerts'
  },
  {
    id: 'amex',
    name: 'American Express',
    icon: '💸',
    description: 'Charge notifications'
  }
];

const SmsProviderSelectionScreen = ({ onComplete }: SmsProviderSelectionScreenProps) => {
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  
  const toggleProvider = (providerId: string) => {
    setSelectedProviders(prev => {
      if (prev.includes(providerId)) {
        return prev.filter(id => id !== providerId);
      } else {
        return [...prev, providerId];
      }
    });
  };
  
  const handleContinue = () => {
    onComplete(selectedProviders);
  };

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <MessageSquare className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-lg font-medium">Select SMS Providers</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Choose the banks or financial services that send you SMS notifications
        </p>
      </div>
      
      <div className="grid grid-cols-1 gap-3 max-h-[320px] overflow-y-auto pr-1">
        {smsProviders.map((provider) => (
          <div 
            key={provider.id}
            className={`
              border rounded-lg p-4 cursor-pointer transition-colors
              ${selectedProviders.includes(provider.id) 
                ? 'border-primary bg-primary/5' 
                : 'border-border hover:border-primary/50'}
            `}
            onClick={() => toggleProvider(provider.id)}
          >
            <div className="flex items-start">
              <div className="flex-shrink-0 text-2xl mr-3">
                {provider.icon}
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-foreground">{provider.name}</h4>
                <p className="text-sm text-muted-foreground">{provider.description}</p>
              </div>
              {selectedProviders.includes(provider.id) && (
                <div className="flex-shrink-0 ml-2">
                  <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 pt-4 border-t border-border">
        <WireframeButton 
          onClick={handleContinue} 
          variant="primary"
          className="w-full"
          disabled={selectedProviders.length === 0}
        >
          {selectedProviders.length === 0 
            ? "Select at least one provider" 
            : `Continue with ${selectedProviders.length} selected`}
        </WireframeButton>
        
        <button 
          onClick={() => onComplete([])} 
          className="w-full text-center mt-3 text-sm text-muted-foreground hover:text-foreground"
        >
          Skip for now
        </button>
      </div>
    </motion.div>
  );
};

export default SmsProviderSelectionScreen;
