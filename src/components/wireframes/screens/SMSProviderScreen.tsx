import React, { useState, useEffect } from 'react';
import WireframeContainer from '../WireframeContainer';
import WireframeHeader from '../WireframeHeader';
import WireframeButton from '../WireframeButton';
import { Calendar, ChevronRight, Search, AlertTriangle, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';

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
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedProviders, setDetectedProviders] = useState<string[]>([]);
  const [hasDetections, setHasDetections] = useState(false);

  // Calculate today's date and 6 months ago
  const today = new Date();
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(today.getMonth() - 6);
  
  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  };

  const providers = [
    { id: "bank-abc", name: "Bank ABC", pattern: "Transaction alert: $AMOUNT at...", isDetected: false },
    { id: "credit-xyz", name: "Credit Card XYZ", pattern: "Your card was charged $AMOUNT...", isDetected: false },
    { id: "investment", name: "Investment Corp", pattern: "Portfolio update: $AMOUNT deposited...", isDetected: false },
    { id: "digital-wallet", name: "Digital Wallet", pattern: "Payment of $AMOUNT received...", isDetected: false },
    { id: "mobile-banking", name: "Mobile Banking", pattern: "You spent $AMOUNT at...", isDetected: false }
  ].map(p => ({
    ...p,
    isDetected: detectedProviders.includes(p.id)
  }));

  const filteredProviders = providers.filter(provider => 
    provider.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    // Simulate auto-detection of providers
    const detectProviders = async () => {
      setIsDetecting(true);
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate detected providers
      const detected = ["bank-abc", "credit-xyz"];
      setDetectedProviders(detected);
      
      // Auto-select detected providers if none are selected yet
      if (selectedProviders.length === 0) {
        setSelectedProviders(detected);
      }
      
      setHasDetections(detected.length > 0);
      setIsDetecting(false);
    };
    
    detectProviders();
  }, []);

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
      
        {hasDetections && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-2 mb-2 flex items-start">
            <Check className="text-green-500 me-2 mt-0.5" size={16} />
            <div>
              <h3 className="text-sm font-medium text-green-800">Providers Detected!</h3>
              <p className="text-xs text-green-600">
                We've automatically detected some SMS providers from your messages.
              </p>
            </div>
          </div>
        )}
      
        <div className="relative mb-4">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            type="text"
            placeholder="Search SMS Contacts"
            className="ps-8 dark:bg-white dark:text-black"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-2 mb-2 flex items-center text-red-700">
            <AlertTriangle className="me-2 text-red-500" size={16} />
            <span className="text-sm">{error}</span>
          </div>
        )}
        
        {isDetecting ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="p-3 border rounded-lg animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-100 rounded w-1/2"></div>
              </div>
            ))}
            <p className="text-center text-sm text-gray-500">Scanning for SMS providers...</p>
          </div>
        ) : (
          <div className="max-h-64 overflow-y-auto space-y-2">
            {filteredProviders.length > 0 ? (
              filteredProviders.map(provider => (
                <div 
                  key={provider.id} 
                  className={`p-3 border rounded-lg flex items-center justify-between cursor-pointer transition ${
                    selectedProviders.includes(provider.id) 
                      ? 'bg-blue-50 border-blue-300' 
                      : 'bg-white hover:bg-gray-50'
                  } ${provider.isDetected && !selectedProviders.includes(provider.id) ? 'border-amber-300' : ''}`}
                  onClick={() => toggleProvider(provider.id)}
                >
                  <div className="flex items-center">
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center me-3 ${
                      selectedProviders.includes(provider.id)
                        ? 'bg-blue-500 border-blue-500'
                        : 'border-gray-300'
                    }`}>
                      {selectedProviders.includes(provider.id) && <Check size={12} className="text-white" />}
                    </div>
                    <div>
                      <div className="flex items-center">
                        <span className="font-medium">{provider.name}</span>
                        {provider.isDetected && (
                          <span className="ms-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                            Detected
                          </span>
                        )}
                      </div>
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
        )}
        
        <div className="mt-4 space-y-2">
          <label className="block text-gray-700 text-sm font-medium">Select Start Date</label>
          <div 
            className={`flex items-center border rounded-lg p-3 cursor-pointer hover:bg-gray-50 ${
              startDate ? 'border-blue-300 bg-blue-50' : ''
            }`}
            onClick={handleDateSelect}
          >
            <Calendar className={`me-2 ${startDate ? 'text-blue-500' : 'text-gray-500'}`} size={20} />
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
