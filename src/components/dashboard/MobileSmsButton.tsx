
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { smsProviderSelectionService } from '@/services/SmsProviderSelectionService';
import { useToast } from '@/hooks/use-toast';

const MobileSmsButton = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const handleSmsButtonClick = () => {
    // Check if user has selected SMS providers
    const hasProviders = smsProviderSelectionService.isProviderSelectionCompleted();
    
    if (!hasProviders) {
      // Navigate to SMS provider selection screen
      toast({
        title: "SMS Providers Needed",
        description: "Select the financial institutions that send you SMS alerts",
      });
      navigate('/sms-providers');
    } else {
      // Navigate to process SMS screen
      navigate('/process-sms');
    }
  };
  
  return (
    <Button 
      variant="outline" 
      size="sm" 
      className="w-full bg-primary/5 border-primary/20 text-primary hover:bg-primary/10"
      onClick={handleSmsButtonClick}
    >
      <MessageSquare className="h-4 w-4 mr-2" />
      Import Transactions from SMS
    </Button>
  );
};

export default MobileSmsButton;
