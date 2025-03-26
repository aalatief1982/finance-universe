
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import EnterPhoneForm from './phone-verification/EnterPhoneForm';
import VerificationCodeForm from './phone-verification/VerificationCodeForm';
import { usePhoneVerification } from './phone-verification/usePhoneVerification';
import { Check, AlertCircle, ArrowLeft } from 'lucide-react';
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
    success,
    isLoading,
    handleSendCode,
    handleVerificationCodeChange,
    handleResendCode,
    handleVerifyCode
  } = usePhoneVerification(() => {
    toast({
      title: "Verification successful",
      description: `Phone ${phoneNumber} has been verified`,
    });
    onNext();
  });

  // Mock function for email verification - in a real app this would connect to a real service
  const handleEmailVerification = async (email: string) => {
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
      
      <Tabs defaultValue="phone" value={verificationMethod} onValueChange={(v) => setVerificationMethod(v as 'phone' | 'email')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="phone">Phone Number</TabsTrigger>
          <TabsTrigger value="email">Email Address</TabsTrigger>
        </TabsList>
        
        <TabsContent value="phone" className="space-y-4 pt-4">
          {success && (
            <Alert className="bg-green-50 border-green-200">
              <Check className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">{success}</AlertDescription>
            </Alert>
          )}
          
          {error && (
            <Alert variant="destructive" className="bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!isVerificationSent ? (
            <EnterPhoneForm
              phoneNumber={phoneNumber}
              setPhoneNumber={setPhoneNumber}
              handleSendCode={handleSendCode}
              isLoading={isLoading}
              error={error}
              success={success}
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
              success={success}
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
                className="w-full p-2 border rounded"
              />
            </div>
            <Button 
              className="w-full" 
              onClick={() => handleEmailVerification('user@example.com')}
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
