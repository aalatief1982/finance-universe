
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, LucideIcon } from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { smsProviderSelectionService, SmsProvider } from '@/services/SmsProviderSelectionService';
import { smsPermissionService } from '@/services/SmsPermissionService';

const SmsProviderSelection = () => {
  const [providers, setProviders] = useState<SmsProvider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  useEffect(() => {
    // Check if SMS permission is granted
    if (!smsPermissionService.hasPermission()) {
      toast({
        title: "Permission required",
        description: "SMS permission is needed to select providers",
        variant: "destructive",
      });
      navigate('/dashboard');
      return;
    }
    
    // Load providers
    const loadProviders = async () => {
      setIsLoading(true);
      try {
        const allProviders = smsProviderSelectionService.getAllProviders();
        setProviders(allProviders);
      } catch (error) {
        console.error('Error loading providers:', error);
        toast({
          title: "Error loading providers",
          description: "Failed to load SMS providers",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProviders();
  }, [navigate, toast]);
  
  const handleToggleProvider = (provider: SmsProvider) => {
    // Toggle the provider's enabled state
    smsProviderSelectionService.toggleProvider(provider.id, !provider.enabled);
    
    // Update local state
    setProviders(prev => 
      prev.map(p => 
        p.id === provider.id ? { ...p, enabled: !p.enabled } : p
      )
    );
  };
  
  const handleSave = () => {
    const selectedProviders = providers.filter(p => p.enabled);
    
    if (selectedProviders.length === 0) {
      toast({
        title: "No providers selected",
        description: "Please select at least one provider to continue",
        variant: "destructive",
      });
      return;
    }
    
    // Save the selected providers
    smsProviderSelectionService.saveProviders(providers);
    
    toast({
      title: "Providers saved",
      description: `${selectedProviders.length} providers selected for SMS processing`,
    });
    
    // Navigate to the process SMS page
    navigate('/process-sms');
  };
  
  const handleBack = () => {
    navigate(-1);
  };
  
  const selectedCount = providers.filter(p => p.enabled).length;
  
  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md mx-auto space-y-6"
      >
        <div className="flex items-center justify-between">
          <button 
            onClick={handleBack}
            className="p-2 -ml-2 rounded-full hover:bg-secondary"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold">SMS Providers</h1>
          <div className="w-8"></div>
        </div>
        
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 space-y-4">
          <div>
            <h2 className="text-xl font-semibold mb-1">Select Your Banks</h2>
            <p className="text-sm text-muted-foreground">
              We'll only process messages from the financial institutions you select.
            </p>
          </div>
          
          {isLoading ? (
            <div className="py-8 text-center">
              <div className="animate-spin h-8 w-8 border-4 border-primary/20 border-t-primary rounded-full mx-auto mb-4"></div>
              <p>Loading providers...</p>
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              {providers.map(provider => (
                <div 
                  key={provider.id}
                  className={`p-4 rounded-lg border ${provider.enabled ? 'border-primary bg-primary/10' : 'border-border bg-card'} 
                              transition-colors cursor-pointer flex items-center justify-between`}
                  onClick={() => handleToggleProvider(provider)}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full ${provider.enabled ? 'bg-primary/20' : 'bg-secondary'} 
                                  flex items-center justify-center`}>
                      <span className="text-lg font-bold">{provider.name.charAt(0)}</span>
                    </div>
                    <div>
                      <h3 className="font-medium">{provider.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {provider.patterns.join(', ')}
                      </p>
                    </div>
                  </div>
                  
                  <div className={`w-6 h-6 rounded-full ${provider.enabled ? 'bg-primary' : 'bg-secondary border border-muted-foreground'} 
                                flex items-center justify-center`}>
                    {provider.enabled && <Check className="text-white" size={14} />}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="pt-4">
            <Button 
              onClick={handleSave} 
              disabled={selectedCount === 0}
              className="w-full"
            >
              Continue with {selectedCount} {selectedCount === 1 ? 'Provider' : 'Providers'}
            </Button>
          </div>
        </div>
        
        <div className="bg-secondary p-4 rounded-lg text-sm">
          <p className="font-medium mb-1">Privacy Note</p>
          <p className="text-muted-foreground">
            We only process SMS messages from the providers you select. Your personal messages remain private.
          </p>
        </div>
      </motion.div>
    </Layout>
  );
};

export default SmsProviderSelection;
