import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, MessageSquare, Calendar, Search, Loader2 } from 'lucide-react';
import WireframeButton from '../../WireframeButton';
import { smsProviderSelectionService, SmsProvider } from '@/services/SmsProviderSelectionService';
import { useToast } from '@/components/ui/use-toast';
import { smsPermissionService } from '@/services/SmsPermissionService';

interface SmsProviderSelectionScreenProps {
  onComplete: (selectedProviders: string[]) => void;
  onSkip: () => void;
}

const SmsProviderSelectionScreen = ({ onComplete, onSkip }: SmsProviderSelectionScreenProps) => {
  const [providers, setProviders] = useState<SmsProvider[]>([]);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasDetectedProviders, setHasDetectedProviders] = useState<boolean>(false);
  const { toast } = useToast();
  
  // Load providers on component mount and check permission status
  useEffect(() => {
    const initializeScreen = async () => {
      setIsLoading(true);
      
      // Check if SMS permission is already granted
      const hasPermission = await smsPermissionService.hasPermission();
      setPermissionGranted(hasPermission);
      
      try {
        // Get providers with detection if permission is granted
        let providersToUse = smsProviderSelectionService.getSmsProviders();
        
        // If we're in a native environment and have permission, try to detect providers
        if (smsPermissionService.isNativeEnvironment() && hasPermission) {
          // In a real implementation, we would read actual SMS messages here
          // For now, just simulate detection
          providersToUse = smsProviderSelectionService.simulateProviderDetection();
          setHasDetectedProviders(providersToUse.some(p => p.isSelected && p.isDetected));
        } else if (!smsPermissionService.isNativeEnvironment()) {
          // In web environment, simulate provider detection
          providersToUse = smsProviderSelectionService.simulateProviderDetection();
          setHasDetectedProviders(providersToUse.some(p => p.isSelected && p.isDetected));
        }
        
        setProviders(providersToUse);
        
        // Get saved start date if available
        const savedDate = smsProviderSelectionService.getSmsStartDate();
        if (savedDate) {
          setStartDate(savedDate);
        }
      } catch (error) {
        console.error('Error initializing SMS provider selection:', error);
        toast({
          title: "Error loading providers",
          description: "There was a problem loading SMS providers",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeScreen();
  }, [toast]);
  
  const filteredProviders = providers.filter(provider => 
    provider.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const toggleProvider = (providerId: string) => {
    const updatedProviders = smsProviderSelectionService.toggleProviderSelection(providerId);
    setProviders(updatedProviders);
  };
  
  const handleDateSelect = () => {
    // Set to 6 months ago
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const dateString = sixMonthsAgo.toISOString().split('T')[0];
    
    setStartDate(dateString);
    smsProviderSelectionService.saveSmsStartDate(dateString);
    
    toast({
      title: "Date selected",
      description: `Messages from ${dateString} will be analyzed`,
    });
  };

  const requestSmsPermission = async () => {
    if (smsPermissionService.isNativeEnvironment()) {
      setIsLoading(true);
      try {
        const granted = await smsPermissionService.requestPermission();
        setPermissionGranted(granted);
        
        if (granted) {
          toast({
            title: "Permission granted",
            description: "You've successfully granted SMS reading permission",
          });
          
          // Try to detect providers now that we have permission
          try {
            // In a real implementation, we would read SMS messages here
            // For now, just simulate detection
            const detectedProviders = smsProviderSelectionService.simulateProviderDetection();
            setProviders(detectedProviders);
            setHasDetectedProviders(detectedProviders.some(p => p.isSelected && p.isDetected));
          } catch (error) {
            console.error('Error detecting providers:', error);
          }
        } else {
          toast({
            title: "Permission denied",
            description: "SMS reading permission is required for automatic tracking",
          });
        }
      } finally {
        setIsLoading(false);
      }
    } else {
      // In web environment, simulate permission granted
      setPermissionGranted(true);
      smsPermissionService.savePermissionStatus(true);
      
      // Simulate detection
      setIsLoading(true);
      try {
        const detectedProviders = smsProviderSelectionService.simulateProviderDetection();
        setProviders(detectedProviders);
        setHasDetectedProviders(detectedProviders.some(p => p.isSelected && p.isDetected));
      } catch (error) {
        console.error('Error simulating provider detection:', error);
      } finally {
        setIsLoading(false);
      }
      
      toast({
        title: "Development mode",
        description: "SMS permissions simulated in web environment",
      });
    }
  };
  
  const handleContinue = async () => {
    const selectedProviders = providers.filter(p => p.isSelected);
    
    if (selectedProviders.length === 0) {
      toast({
        title: "Selection required",
        description: "Please select at least one provider",
        variant: "destructive"
      });
      return;
    }
    
    // Save the selected providers
    const selectedProviderNames = selectedProviders.map(p => p.name);
    
    if (startDate) {
      smsProviderSelectionService.saveSmsStartDate(startDate);
    }
    
    // If we're in a native environment and permission hasn't been granted yet,
    // request it before proceeding
    if (smsPermissionService.isNativeEnvironment() && !permissionGranted) {
      const granted = await smsPermissionService.requestPermission();
      setPermissionGranted(granted);
      
      // If permission granted, proceed; otherwise, we'll still continue
      // but the user won't get automatic SMS tracking
      smsPermissionService.savePermissionStatus(granted);
    } else if (!smsPermissionService.isNativeEnvironment()) {
      // In web environment, just set mock permission to true
      smsPermissionService.savePermissionStatus(true);
    }
    
    // Complete the process and move to the next screen
    onComplete(selectedProviderNames);
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
      
      {smsPermissionService.isNativeEnvironment() && !permissionGranted && (
        <div className="border-l-4 border-primary bg-primary/5 p-4 rounded-r-lg mb-4">
          <p className="text-sm font-medium">SMS Permission Required</p>
          <p className="text-xs text-muted-foreground mb-2">
            To automatically track your transactions, we need permission to read SMS messages.
          </p>
          <WireframeButton
            onClick={requestSmsPermission}
            variant="outline"
            className="text-xs"
          >
            Grant SMS Permission
          </WireframeButton>
        </div>
      )}
      
      {hasDetectedProviders && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 border border-green-200 p-3 rounded-lg mb-3 flex items-start gap-2"
        >
          <Check className="text-green-600 h-5 w-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-green-800">Providers Detected!</p>
            <p className="text-xs text-green-700">
              We've detected and pre-selected some SMS providers for you.
            </p>
          </div>
        </motion.div>
      )}
      
      <div className="relative mb-2">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <input
          type="text"
          placeholder="Search providers..."
          className="w-full pl-9 py-2 pr-3 border rounded-md text-sm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      <div className="grid grid-cols-1 gap-3 max-h-[320px] overflow-y-auto pr-1">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Loader2 className="h-8 w-8 text-primary animate-spin mb-2" />
            <p className="text-sm text-muted-foreground">Scanning for SMS providers...</p>
          </div>
        ) : filteredProviders.length > 0 ? (
          filteredProviders.map((provider) => (
            <div 
              key={provider.id}
              className={`
                border rounded-lg p-4 cursor-pointer transition-colors
                ${provider.isSelected 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50'}
                ${provider.isDetected && !provider.isSelected ? 'border-amber-300' : ''}
              `}
              onClick={() => toggleProvider(provider.id)}
            >
              <div className="flex items-start">
                <div className="flex-shrink-0 text-2xl mr-3">
                  {provider.id.includes('bank') ? '🏦' : 
                   provider.id.includes('credit') ? '💳' :
                   provider.id.includes('investment') ? '📈' :
                   provider.id.includes('digital') ? '💸' : '💰'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center">
                    <h4 className="font-medium text-foreground">{provider.name}</h4>
                    {provider.isDetected && (
                      <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                        Detected
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{provider.pattern}</p>
                </div>
                {provider.isSelected && (
                  <div className="flex-shrink-0 ml-2">
                    <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-sm text-muted-foreground">No providers match your search</p>
          </div>
        )}
      </div>
      
      <div className="border rounded-lg p-4 cursor-pointer hover:bg-secondary/50" onClick={handleDateSelect}>
        <div className="flex items-center">
          <Calendar className="mr-3 text-primary" size={24} />
          <div>
            <h4 className="font-medium">Set Start Date</h4>
            <p className="text-sm text-muted-foreground">
              {startDate || "Select when to start analyzing messages"}
            </p>
          </div>
        </div>
      </div>
      
      <div className="mt-6 pt-4 border-t border-border">
        <WireframeButton 
          onClick={handleContinue} 
          variant="primary"
          className="w-full"
          disabled={providers.filter(p => p.isSelected).length === 0}
        >
          {providers.filter(p => p.isSelected).length === 0 
            ? "Select at least one provider" 
            : `Continue with ${providers.filter(p => p.isSelected).length} selected`}
        </WireframeButton>
        
        <button 
          onClick={onSkip} 
          className="w-full text-center mt-3 text-sm text-muted-foreground hover:text-foreground"
        >
          Skip for now
        </button>
      </div>
    </motion.div>
  );
};

export default SmsProviderSelectionScreen;
