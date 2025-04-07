
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, ChevronRight, Search, AlertCircle, Check, RefreshCw } from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { smsProviderSelectionService, SmsProvider } from '@/services/SmsProviderSelectionService';
import { smsPermissionService } from '@/services/SmsPermissionService';

const SmsProviderSelection = () => {
  const [providers, setProviders] = useState<SmsProvider[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [hasDetectedProviders, setHasDetectedProviders] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Load providers on mount
  useEffect(() => {
    const loadProviders = async () => {
      setIsLoading(true);
      try {
        // Get initial providers
        let loadedProviders = smsProviderSelectionService.getSmsProviders();
        setProviders(loadedProviders);
        
        // Check if there are any detected providers
        setHasDetectedProviders(loadedProviders.some(p => p.isDetected));
        
        // Check if there's a previously saved start date
        const savedDate = smsProviderSelectionService.getSmsStartDate();
        if (savedDate) {
          setStartDate(new Date(savedDate));
        }
      } catch (error) {
        toast({
          title: "Error loading providers",
          description: "Failed to load SMS providers. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProviders();
  }, [toast]);

  const filteredProviders = providers.filter(provider => 
    provider.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleProvider = (providerId: string) => {
    const updatedProviders = smsProviderSelectionService.toggleProviderSelection(providerId);
    setProviders(updatedProviders);
  };

  const handleDateSelect = () => {
    // Set to 6 months ago for a reasonable history
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    setStartDate(sixMonthsAgo);
    
    // Save the date
    smsProviderSelectionService.saveSmsStartDate(sixMonthsAgo.toISOString());
    
    toast({
      title: "Date selected",
      description: `We'll analyze messages from ${sixMonthsAgo.toLocaleDateString()} forward.`,
    });
  };

  const handleScanSms = async () => {
    // Check for SMS permission
    if (!smsPermissionService.hasPermission()) {
      const granted = await smsPermissionService.requestPermission();
      if (!granted) {
        toast({
          title: "Permission required",
          description: "SMS permission is needed to scan for providers",
          variant: "destructive",
        });
        return;
      }
    }
    
    setIsScanning(true);
    
    try {
      // In a real implementation, this would access actual SMS messages
      // through a Capacitor plugin
      const messages = await smsProviderSelectionService.accessNativeSms();
      
      if (messages.length === 0) {
        toast({
          title: "No messages found",
          description: "We couldn't find any SMS messages to analyze",
          variant: "destructive",
        });
        setIsScanning(false);
        return;
      }
      
      // Process the messages to find providers
      const detectedProviders = smsProviderSelectionService.detectProvidersFromMessages(messages);
      setProviders(detectedProviders);
      setHasDetectedProviders(detectedProviders.some(p => p.isDetected));
      
      toast({
        title: "SMS scan complete",
        description: `Found ${detectedProviders.filter(p => p.isDetected).length} potential providers`,
      });
    } catch (error) {
      console.error('Error scanning SMS:', error);
      toast({
        title: "Error scanning SMS",
        description: "There was a problem accessing your SMS messages",
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleContinue = () => {
    const selectedProviders = providers.filter(p => p.isSelected);
    
    if (selectedProviders.length === 0) {
      toast({
        title: "Selection required",
        description: "Please select at least one SMS provider",
        variant: "destructive",
      });
      return;
    }

    // In a real app, this would save the selection to state/local storage
    // Already saving through service
    
    toast({
      title: "Providers selected",
      description: `${selectedProviders.length} providers configured successfully`,
    });
    
    navigate('/dashboard');
  };

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md mx-auto space-y-6"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Select SMS Providers</h1>
          <p className="text-muted-foreground">
            Choose the financial institutions that send you SMS alerts so we can track your expenses automatically.
          </p>
        </div>

        {hasDetectedProviders && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3"
          >
            <Check className="text-green-500 mt-0.5" size={18} />
            <div>
              <h3 className="font-medium text-green-800">Providers Detected!</h3>
              <p className="text-sm text-green-700">
                We've detected some SMS providers in your messages. You can modify this selection.
              </p>
            </div>
          </motion.div>
        )}

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
            <Input 
              placeholder="Search SMS providers..." 
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Button 
            onClick={handleScanSms} 
            disabled={isScanning} 
            variant="outline" 
            className="flex-shrink-0"
          >
            {isScanning ? (
              <>
                <RefreshCw className="mr-1 h-4 w-4 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <Search className="mr-1 h-4 w-4" />
                Scan SMS
              </>
            )}
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="p-4 border rounded-lg animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-100 rounded w-full"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {filteredProviders.length > 0 ? (
              filteredProviders.map(provider => (
                <motion.div
                  key={provider.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`p-4 border rounded-lg flex items-center justify-between cursor-pointer ${
                    provider.isSelected 
                      ? 'bg-primary/5 border-primary' 
                      : 'hover:bg-secondary'
                  }
                  ${provider.isDetected && !provider.isSelected ? 'border-amber-300' : ''}
                  `}
                  onClick={() => toggleProvider(provider.id)}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{provider.name}</h3>
                      {provider.isDetected && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                          Detected
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">Matches: {provider.pattern}</p>
                  </div>
                  {provider.isSelected && (
                    <ChevronRight className="text-primary" size={24} />
                  )}
                </motion.div>
              ))
            ) : (
              <div className="text-center py-10 bg-secondary/30 rounded-lg border border-dashed">
                <Search className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground">
                  {isScanning 
                    ? "Scanning for providers..." 
                    : "No providers found. Try scanning your SMS messages."}
                </p>
                {!isScanning && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleScanSms} 
                    className="mt-3"
                  >
                    Scan SMS
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        <div className="space-y-2">
          <label className="block text-sm font-medium">Select Start Date</label>
          <div 
            className={`flex items-center border rounded-lg p-3 cursor-pointer hover:bg-secondary ${
              startDate ? 'border-primary/50 bg-primary/5' : ''
            }`}
            onClick={handleDateSelect}
          >
            <Calendar className={`mr-2 ${startDate ? 'text-primary' : 'text-muted-foreground'}`} size={20} />
            <span className={startDate ? 'text-foreground' : 'text-muted-foreground'}>
              {startDate ? startDate.toLocaleDateString() : 'Choose Date (Up to 6 months)'}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            We'll analyze messages from this date forward. For privacy, we only access financial SMS.
          </p>
        </div>

        <Button 
          className="w-full" 
          size={isMobile ? "lg" : "default"}
          onClick={handleContinue}
          disabled={isLoading || providers.filter(p => p.isSelected).length === 0}
        >
          Continue
        </Button>
      </motion.div>
    </Layout>
  );
};

export default SmsProviderSelection;
