
import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUser } from '@/context/UserContext';
import WireframeButton from '../../WireframeButton';
import { motion } from 'framer-motion';
import { Phone, Loader2, Info } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

interface PhoneVerificationScreenProps {
  onNext: () => void;
}

const PhoneVerificationScreen = ({ onNext }: PhoneVerificationScreenProps) => {
  const { user, auth, updateUser, startPhoneVerification, confirmPhoneVerification, isLoading } = useUser();
  const [phoneNumber, setPhoneNumber] = useState(user?.phone || '');
  const [isVerificationSent, setIsVerificationSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { toast } = useToast();
  
  // Set verification UI state based on auth context
  useEffect(() => {
    if (auth.isVerifying) {
      setIsVerificationSent(true);
    }
  }, [auth.isVerifying]);
  
  const handleSendCode = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }
    
    setError('');
    
    try {
      const success = await startPhoneVerification(phoneNumber);
      
      if (success) {
        setIsVerificationSent(true);
        setSuccess('Verification code sent successfully!');
        toast({
          title: "Verification code sent",
          description: "For demo purposes, the code is 1234",
          variant: "default",
        });
        
        // In a real app, this would send a verification code to the phone number
        setTimeout(() => {
          setSuccess('');
        }, 3000);
      }
    } catch (err) {
      setError('Failed to send verification code. Please try again.');
    }
  };
  
  const handleVerificationCodeChange = (value: string) => {
    const codeArray = value.split('').slice(0, 4);
    // Pad with empty strings if less than 4 characters
    const paddedArray = [...codeArray, ...Array(4 - codeArray.length).fill('')];
    setVerificationCode(paddedArray);
    
    // If we have a complete 4-digit code, verify it
    if (codeArray.length === 4) {
      handleVerifyCode(codeArray.join(''));
    }
  };

  const handleResendCode = async () => {
    // Reset verification code
    setVerificationCode(['', '', '', '']);
    
    // In a real app, this would resend the verification code
    try {
      const success = await startPhoneVerification(phoneNumber);
      
      if (success) {
        // Show a user-friendly message
        setSuccess('A new code has been sent to your phone');
        toast({
          title: "Code resent",
          description: "For demo purposes, the code is 1234",
          variant: "default",
        });
        setTimeout(() => {
          setSuccess('');
        }, 3000);
      }
    } catch (err) {
      setError('Failed to resend code. Please try again later.');
      setTimeout(() => {
        setError('');
      }, 3000);
    }
  };
  
  const handleVerifyCode = async (code?: string) => {
    const codeToVerify = code || verificationCode.join('');
    if (codeToVerify.length !== 4) {
      setError('Please enter a valid 4-digit code');
      return;
    }
    
    try {
      const success = await confirmPhoneVerification(codeToVerify);
      
      if (success) {
        setSuccess('Phone number verified successfully!');
        toast({
          title: "Verification successful",
          description: "Your phone number has been verified",
          variant: "default",
        });
        
        // Wait a moment before proceeding to next step
        setTimeout(() => {
          // Update user data with phone number
          updateUser({ phone: phoneNumber });
          onNext();
        }, 1000);
      } else {
        // Error message is handled by the context
        setVerificationCode(['', '', '', '']);
        setError('Invalid verification code. Please try again.');
        toast({
          title: "Verification failed",
          description: "Please use code 1234 for this demo",
          variant: "destructive",
        });
      }
    } catch (err) {
      setError('Verification failed. Please try again.');
    }
  };

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      {!isVerificationSent ? (
        <>
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Phone className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-medium">Verify Your Phone Number</h3>
            <p className="text-sm text-muted-foreground mt-1">
              We'll send you a verification code to confirm your phone
            </p>
          </div>
          
          <div className="mb-6">
            <Label htmlFor="phone-number" className="block text-gray-700 mb-2">Enter Mobile Number</Label>
            <Input 
              id="phone-number"
              type="tel" 
              placeholder="+1 (000) 000-0000" 
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className={error ? "border-red-500" : ""}
            />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
            {success && <p className="text-green-500 text-sm mt-1">{success}</p>}
          </div>
          
          <WireframeButton 
            onClick={handleSendCode}
            variant="primary"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending Code...
              </>
            ) : (
              "Send Verification Code"
            )}
          </WireframeButton>
        </>
      ) : (
        <>
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Phone className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-medium">Enter Verification Code</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Enter the 4-digit code sent to <span className="font-medium">{phoneNumber}</span>
            </p>
            {success && <p className="text-green-500 text-sm mt-2">{success}</p>}
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </div>
          
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
            <div className="flex items-start">
              <Info className="h-5 w-5 text-amber-500 mt-0.5 mr-2" />
              <div>
                <p className="text-sm font-medium text-amber-800">Demo Info</p>
                <p className="text-xs text-amber-700">
                  For this demo, please use code: <span className="font-bold">1234</span>
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex justify-center mb-6">
            <InputOTP
              maxLength={4}
              value={verificationCode.join('')}
              onChange={handleVerificationCodeChange}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
              </InputOTPGroup>
            </InputOTP>
          </div>
          
          <div className="text-center">
            <button 
              className="text-primary hover:text-primary/80 text-sm font-medium underline" 
              onClick={handleResendCode}
              type="button"
              disabled={isLoading}
            >
              Didn't receive a code? Resend
            </button>
          </div>
          
          <div className="mt-6">
            <WireframeButton 
              onClick={() => handleVerifyCode()}
              variant={verificationCode.every(digit => digit) ? 'primary' : 'secondary'}
              disabled={isLoading || !verificationCode.every(digit => digit)}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify and Continue"
              )}
            </WireframeButton>
          </div>
        </>
      )}
    </motion.div>
  );
};

export default PhoneVerificationScreen;
