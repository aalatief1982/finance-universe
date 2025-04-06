import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useUser } from '@/context/UserContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, WifiOff } from 'lucide-react';
import PhoneVerification from '@/components/auth/PhoneVerification';
import VerificationCodeForm from './phone-verification/VerificationCodeForm';
import { usePhoneVerification } from './phone-verification/usePhoneVerification';

interface PhoneVerificationScreenProps {
  onNext: () => void;
  onBack?: () => void;
}

const PhoneVerificationScreen = ({ onNext, onBack }: PhoneVerificationScreenProps) => {
  const { toast } = useToast();
  const [verificationMethod, setVerificationMethod] = useState<'phone' | 'email'>('phone');
  const [networkStatus, setNetworkStatus] = useState<'online' | 'offline'>('online');
  
  // Check network status
  React.useEffect(() => {
    const handleOnline = () => setNetworkStatus('online');
    const handleOffline = () => setNetworkStatus('offline');
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Initialize network status
    setNetworkStatus(navigator.onLine ? 'online' : 'offline');
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Mock function for email verification - in a real app this would connect to a real service
  const handleEmailVerification = async (email: string) => {
    // Check email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }
    
    // Check network status
    if (networkStatus === 'offline') {
      toast({
        title: "Network error",
        description: "You appear to be offline. Please check your internet connection.",
        variant: "destructive",
      });
      return;
    }

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast({
      title: "Email verification link sent",
      description: `A verification link has been sent to ${email}`,
    });
    
    // For demo purposes, we'll just proceed to the next step
    setTimeout(() => {
      onNext();
    }, 2000);
  };

  // Offline banner component
  const OfflineBanner = () => {
    if (networkStatus === 'online') return null;
    
    return (
      <Alert className="bg-red-50 border-red-200 mb-4">
        <WifiOff className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-700">
          You are currently offline. Please check your internet connection and try again.
        </AlertDescription>
      </Alert>
    );
  };

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      {onBack && (
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex items-center mb-4" 
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
      )}
      
      <h1 className="text-2xl font-bold tracking-tight">Verify Your Account</h1>
      <p className="text-muted-foreground">
        Please verify your account to continue. You can use your phone number or email address.
      </p>
      
      <OfflineBanner />
      
      <Tabs defaultValue="phone" value={verificationMethod} onValueChange={(v) => setVerificationMethod(v as 'phone' | 'email')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="phone">Phone Number</TabsTrigger>
          <TabsTrigger value="email">Email Address</TabsTrigger>
        </TabsList>
        
        <TabsContent value="phone" className="space-y-4 pt-4">
          <PhoneVerification onVerificationComplete={onNext} />
          
          <div className="text-center mt-6">
            <p className="text-sm text-muted-foreground">
              Having trouble with SMS verification?
            </p>
            <Button 
              variant="link" 
              size="sm"
              onClick={() => setVerificationMethod('email')}
            >
              Try verifying with email instead
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="email" className="space-y-4 pt-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="email">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email address"
                className={`w-full p-2 border rounded ${networkStatus === 'offline' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                disabled={networkStatus === 'offline'}
              />
              {networkStatus === 'offline' && (
                <p className="text-xs text-red-600">
                  <WifiOff className="h-3 w-3 inline mr-1" />
                  This feature is unavailable while offline
                </p>
              )}
            </div>
            <Button 
              className="w-full" 
              onClick={() => handleEmailVerification('user@example.com')}
              disabled={networkStatus === 'offline'}
            >
              Send Verification Link
            </Button>
          </div>
          
          <div className="text-center mt-6">
            <p className="text-sm text-muted-foreground">
              Prefer SMS verification?
            </p>
            <Button 
              variant="link" 
              size="sm"
              onClick={() => setVerificationMethod('phone')}
            >
              Try verifying with phone instead
            </Button>
          </div>
        </TabsContent>
      </Tabs>
      
      <div className="text-center mt-8 border-t pt-4">
        <p className="text-xs text-muted-foreground">
          By verifying your account, you agree to our Terms of Service and Privacy Policy.
          We will use your contact information to send you important updates and notifications.
        </p>
      </div>
    </motion.div>
  );
};

export default PhoneVerificationScreen;
