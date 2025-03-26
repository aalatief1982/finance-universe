
import { useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { useToast } from '@/components/ui/use-toast';

export const usePhoneVerification = (onNext: () => void) => {
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

  return {
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
  };
};
