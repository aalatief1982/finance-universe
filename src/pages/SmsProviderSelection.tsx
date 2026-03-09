/**
 * @file SmsProviderSelection.tsx
 * @description Page component for SmsProviderSelection.
 */
import { safeStorage } from "@/utils/safe-storage";
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, ChevronRight, Search, Check } from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { smsProviderSelectionService, SmsProvider } from '@/services/SmsProviderSelectionService';
import { useLanguage } from '@/i18n/LanguageContext';
import { cn } from '@/lib/utils';

const SmsProviderSelection = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { t, language } = useLanguage();
  const isRtl = language === 'ar';
  const [providers, setProviders] = useState<SmsProvider[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [hasDetectedProviders, setHasDetectedProviders] = useState(false);

  useEffect(() => {
    const loadProviders = async () => {
      try {
        const loadedProviders = await smsProviderSelectionService.loadProviders();
        const detected = loadedProviders.some(p => p.isDetected);
        setHasDetectedProviders(detected);
        setProviders(loadedProviders);
        
        const savedDate = smsProviderSelectionService.getSmsStartDate();
        if (savedDate) {
          setStartDate(new Date(savedDate));
        }
      } catch (error) {
        toast({
          title: t('toast.errorLoadingProviders'),
          description: t('toast.errorLoadingProvidersDesc'),
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProviders();
  }, [toast, t]);

  const filteredProviders = providers.filter(provider => 
    provider.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleProvider = (providerId: string) => {
    const updatedProviders = smsProviderSelectionService.toggleProviderSelection(providerId);
    setProviders(updatedProviders);
  };

  const handleDateSelect = () => {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    setStartDate(sixMonthsAgo);
    smsProviderSelectionService.saveSmsStartDate(sixMonthsAgo.toISOString());
    
    toast({
      title: t('toast.dateSelected'),
      description: t('toast.dateSelectedDesc').replace('{date}', sixMonthsAgo.toLocaleDateString()),
    });
  };

  const handleContinue = () => {
    const selectedProviders = providers.filter(p => p.isSelected);
    
    if (selectedProviders.length === 0) {
      toast({
        title: t('toast.selectionRequired'),
        description: t('toast.selectionRequiredDesc'),
        variant: "destructive",
      });
      return;
    }

    smsProviderSelectionService.saveSelectedProviders(providers);
    safeStorage.setItem('smsProviders', JSON.stringify(
      selectedProviders.map(p => ({ id: p.id, name: p.name }))
    ));
    
    toast({
      title: t('toast.providersSelected'),
      description: t('toast.providersSelectedDesc').replace('{count}', String(selectedProviders.length)),
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
          <h1 className="text-3xl font-bold tracking-tight mb-2">{t('smsProvider.title')}</h1>
          <p className="text-muted-foreground">{t('smsProvider.subtitle')}</p>
        </div>

        {hasDetectedProviders && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-green-50 border border-green-200 rounded-lg p-[var(--card-padding)] flex items-start gap-3"
          >
            <Check className="text-green-500 mt-0.5" size={18} />
            <div>
              <h3 className="font-medium text-green-800">{t('smsProvider.detected')}</h3>
              <p className="text-sm text-green-700">{t('smsProvider.detectedDesc')}</p>
            </div>
          </motion.div>
        )}

        {providers.length > 0 && (
          <div className="relative">
            <Search className="absolute ltr:left-3 rtl:right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
            <Input 
              placeholder={t('smsProvider.searchPlaceholder')}
              className="ltr:pl-10 rtl:pr-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        )}

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="p-[var(--card-padding)] border rounded-lg animate-pulse">
                <div className="h-5 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-muted/50 rounded w-full"></div>
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
                  onKeyDown={(e) => e.key === 'Enter' && toggleProvider(provider.id)}
                  role="button"
                  tabIndex={0}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{provider.name}</h3>
                      {provider.isDetected && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                          {t('smsProvider.detectedBadge')}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{t('smsProvider.matches')} {provider.pattern}</p>
                  </div>
                  {provider.isSelected && (
                    <ChevronRight className={cn("text-primary", isRtl && "rotate-180")} size={24} />
                  )}
                </motion.div>
              ))
            ) : (
              providers.length > 0 ? (
                <p className="text-center text-muted-foreground py-4">{t('smsProvider.noProvidersFound')}</p>
              ) : (
                <div className="border rounded-lg p-[var(--card-padding)] space-y-4 text-center">
                  <p className="font-medium">{t('smsProvider.noProvidersConfigured')}</p>
                  <p className="text-sm text-muted-foreground">{t('smsProvider.importFromSms')}</p>
                  <Button variant="outline" onClick={() => navigate('/process-sms')}>
                    {t('smsProvider.importFromScan')}
                  </Button>
                </div>
              )
            )}
          </div>
        )}

        <div className="space-y-2">
          <label className="block text-sm font-medium" htmlFor="sms-provider-start-date">
            {t('smsProvider.selectStartDate')}
          </label>
          <div 
            id="sms-provider-start-date"
            className={`flex items-center border rounded-lg p-3 cursor-pointer hover:bg-secondary ${
              startDate ? 'border-primary/50 bg-primary/5' : ''
            }`}
            onClick={handleDateSelect}
            onKeyDown={(e) => e.key === 'Enter' && handleDateSelect()}
            role="button"
            tabIndex={0}
          >
            <Calendar className={`ltr:mr-2 rtl:ml-2 ${startDate ? 'text-primary' : 'text-muted-foreground'}`} size={20} />
            <span className={startDate ? 'text-foreground' : 'text-muted-foreground'}>
              {startDate ? startDate.toLocaleDateString() : t('smsProvider.chooseDate')}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">{t('smsProvider.privacyNote')}</p>
        </div>

        <Button 
          className="w-full" 
          size={isMobile ? "lg" : "default"}
          onClick={handleContinue}
          disabled={isLoading || providers.length === 0}
        >
          {t('smsProvider.continue')}
        </Button>
      </motion.div>
    </Layout>
  );
};

export default SmsProviderSelection;
