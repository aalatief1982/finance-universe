/**
 * @file SmsProviderSelection.tsx
 * @description Page component for SmsProviderSelection.
 *
 * @module pages/SmsProviderSelection
 *
 * @responsibilities
 * 1. Compose layout and section components
 * 2. Load data or invoke services for the page
 * 3. Handle navigation and page-level actions
 *
 * @review-tags
 * - @ui: page composition
 *
 * @review-checklist
 * - [ ] Data loading handles empty states
 * - [ ] Navigation hooks are wired correctly
 */
import { safeStorage } from "@/utils/safe-storage";
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, ChevronRight, Search, AlertCircle, Check } from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { smsProviderSelectionService, SmsProvider } from '@/services/SmsProviderSelectionService';

const SmsProviderSelection = () => {
  const [providers, setProviders] = useState<SmsProvider[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [hasDetectedProviders, setHasDetectedProviders] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Load providers on mount and attempt auto-detection
  useEffect(() => {
    const loadProviders = async () => {
      setIsLoading(true);
      try {
        // Get initial providers
        let loadedProviders = smsProviderSelectionService.getSmsProviders();
        
        // If in web environment, simulate provider detection
        if (!smsProviderSelectionService.isNativeEnvironment()) {
          loadedProviders = smsProviderSelectionService.simulateProviderDetection();
          setHasDetectedProviders(loadedProviders.some(p => p.isSelected && p.isDetected));
        } else {
          // In native environment, we'd request SMS access and analyze messages
          // This requires actual device testing, so we'll fallback to simulation for now
          const hasPermission = smsProviderSelectionService.hasSmsPermission();
          
          if (hasPermission) {
            // In a real implementation, we would read SMS messages here
            // For now, we'll just simulate detection in native environment too
            loadedProviders = smsProviderSelectionService.simulateProviderDetection();
            setHasDetectedProviders(loadedProviders.some(p => p.isSelected && p.isDetected));
          }
        }
        
        setProviders(loadedProviders);
        
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
    // Already saving through service, but we'll also save to localStorage for backward compatibility
    safeStorage.setItem('smsProviders', JSON.stringify(
      selectedProviders.map(p => ({ id: p.id, name: p.name }))
    ));
    
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
            className="bg-green-50 border border-green-200 rounded-lg p-[var(--card-padding)] flex items-start gap-3"
          >
            <Check className="text-green-500 mt-0.5" size={18} />
            <div>
              <h3 className="font-medium text-green-800">Providers Detected!</h3>
              <p className="text-sm text-green-700">
                We've detected some SMS providers and pre-selected them for you. You can modify this selection.
              </p>
            </div>
          </motion.div>
        )}

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
          <Input 
            placeholder="Search SMS providers..." 
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="p-[var(--card-padding)] border rounded-lg animate-pulse">
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
                  className={`p-[var(--card-padding)] border rounded-lg flex items-center justify-between cursor-pointer ${
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
              <p className="text-center text-muted-foreground py-4">No providers found</p>
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
          disabled={isLoading}
        >
          Continue
        </Button>
      </motion.div>
    </Layout>
  );
};

export default SmsProviderSelection;
