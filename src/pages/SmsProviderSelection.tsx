
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, ChevronRight, Search } from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

// Mock SMS providers - in a real app, this would come from the SMS API
const SMS_PROVIDERS = [
  { id: 1, name: 'Bank ABC', pattern: 'transaction of $AMOUNT has been processed' },
  { id: 2, name: 'Credit Card XYZ', pattern: 'payment of $AMOUNT at' },
  { id: 3, name: 'Investment Corp', pattern: 'dividend payment of $AMOUNT' },
  { id: 4, name: 'Mobile Banking', pattern: 'transfer of $AMOUNT to' },
  { id: 5, name: 'Digital Wallet', pattern: 'received $AMOUNT from' },
];

const SmsProviderSelection = () => {
  const [selectedProviders, setSelectedProviders] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const filteredProviders = SMS_PROVIDERS.filter(provider => 
    provider.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleProvider = (providerId: number) => {
    setSelectedProviders(prev => 
      prev.includes(providerId) 
        ? prev.filter(id => id !== providerId)
        : [...prev, providerId]
    );
  };

  const handleDateSelect = () => {
    // This would open a date picker in a real implementation
    setStartDate(new Date());
  };

  const handleContinue = () => {
    if (selectedProviders.length === 0) {
      toast({
        title: "Selection required",
        description: "Please select at least one SMS provider",
        variant: "destructive",
      });
      return;
    }

    // In a real app, this would save the selection to state/local storage
    localStorage.setItem('smsProviders', JSON.stringify(
      selectedProviders.map(id => SMS_PROVIDERS.find(p => p.id === id))
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

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
          <Input 
            placeholder="Search SMS providers..." 
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {filteredProviders.length > 0 ? (
            filteredProviders.map(provider => (
              <motion.div
                key={provider.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`p-4 border rounded-lg flex items-center justify-between cursor-pointer ${
                  selectedProviders.includes(provider.id) 
                    ? 'bg-primary/5 border-primary' 
                    : 'hover:bg-secondary'
                }`}
                onClick={() => toggleProvider(provider.id)}
              >
                <div>
                  <h3 className="font-medium">{provider.name}</h3>
                  <p className="text-sm text-muted-foreground">Matches: {provider.pattern}</p>
                </div>
                {selectedProviders.includes(provider.id) && (
                  <ChevronRight className="text-primary" size={24} />
                )}
              </motion.div>
            ))
          ) : (
            <p className="text-center text-muted-foreground py-4">No providers found</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Select Start Date</label>
          <div 
            className="flex items-center border rounded-lg p-3 cursor-pointer hover:bg-secondary"
            onClick={handleDateSelect}
          >
            <Calendar className="mr-2 text-muted-foreground" size={20} />
            <span className="text-muted-foreground">
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
        >
          Continue
        </Button>
      </motion.div>
    </Layout>
  );
};

export default SmsProviderSelection;
