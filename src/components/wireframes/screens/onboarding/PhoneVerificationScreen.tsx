
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import EnterPhoneForm from './phone-verification/EnterPhoneForm';
import VerificationCodeForm from './phone-verification/VerificationCodeForm';
import { usePhoneVerification } from './phone-verification/usePhoneVerification';
import { Check, AlertCircle, ArrowLeft, WifiOff, Clock, ShieldAlert } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PhoneVerificationScreenProps {
  onNext: () => void;
  onBack?: () => void;
}

const PhoneVerificationScreen = ({ onNext, onBack }: PhoneVerificationScreenProps) => {
  const { toast } = useToast();
  const [verificationMethod, setVerificationMethod] = useState<'phone' | 'email'>('phone');
  
  const {
    phoneNumber,
    setPhoneNumber,
    isVerificationSent,
    verificationCode,
    error,
    errorType,
    success,
    isLoading,
    networkStatus,
    sessionTimeRemaining,
    formatRemainingTime,
    handleSendCode,
    handleVerificationCodeChange,
    handleResendCode,
    handleVerifyCode,
    validatePhoneNumber
  } = usePhoneVerification(() => {
    toast({
      title: "Verification successful",
      description: `Phone ${phoneNumber} has been verified`,
    });
    onNext();
  });

  // Error icon based on error type
  const getErrorIcon = () => {
    switch (errorType) {
      case 'network':
        return <WifiOff className="h-4 w-4 text-red-600" />;
      case 'validation':
        return <AlertCircle className="h-4 w-4 text-amber-600" />;
      case 'auth':
        return <ShieldAlert className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-red-600" />;
    }
  };

  // Error alert variant based on error type
  const getErrorAlertClass = () => {
    switch (errorType) {
      case 'network':
        return "bg-red-50 border-red-200";
      case 'validation':
        return "bg-amber-50 border-amber-200";
      case 'auth':
        return "bg-red-50 border-red-200";
      default:
        return "bg-red-50 border-red-200";
    }
  };

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
          <AnimatePresence mode="wait">
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Alert className="bg-green-50 border-green-200">
                  <Check className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-700">{success}</AlertDescription>
                </Alert>
              </motion.div>
            )}
            
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Alert className={getErrorAlertClass()}>
                  {getErrorIcon()}
                  <AlertDescription className="text-red-700">{error}</AlertDescription>
                  
                  {/* Additional help text based on error type */}
                  {errorType === 'network' && (
                    <div className="mt-2 text-sm text-red-600">
                      Please check your connection and try again. If the problem persists, 
                      try switching to a different network.
                    </div>
                  )}
                  
                  {errorType === 'validation' && phoneNumber && !validatePhoneNumber(phoneNumber) && (
                    <div className="mt-2 text-sm text-amber-600">
                      The phone number should include the country code (e.g., +1 for US/Canada).
                    </div>
                  )}
                  
                  {errorType === 'auth' && error.includes('session has expired') && (
                    <div className="mt-2 text-sm text-red-600">
                      <Clock className="h-3 w-3 inline mr-1" />
                      Verification sessions expire after 15 minutes for security reasons.
                    </div>
                  )}
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          {!isVerificationSent ? (
            <EnterPhoneForm
              phoneNumber={phoneNumber}
              setPhoneNumber={setPhoneNumber}
              handleSendCode={handleSendCode}
              isLoading={isLoading}
              error={error}
              errorType={errorType}
              success={success}
              isOffline={networkStatus === 'offline'}
              validatePhoneNumber={validatePhoneNumber}
            />
          ) : (
            <VerificationCodeForm
              phoneNumber={phoneNumber}
              verificationCode={verificationCode}
              handleVerificationCodeChange={handleVerificationCodeChange}
              handleResendCode={handleResendCode}
              handleVerifyCode={() => handleVerifyCode()}
              isLoading={isLoading}
              error={error}
              errorType={errorType}
              success={success}
              sessionTimeRemaining={sessionTimeRemaining}
              formatRemainingTime={formatRemainingTime}
              isOffline={networkStatus === 'offline'}
            />
          )}
          
          {!isVerificationSent && (
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
          )}
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
