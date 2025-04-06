import { useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { useToast } from '@/hooks/use-toast';
import { 
  getVerificationSessionTimeout, 
  getVerificationSessionTimeRemaining 
} from '@/lib/supabase-auth';
import { handleValidationError } from '@/utils/error-utils';

export const usePhoneVerification = (onNext: () => void) => {
  const { user, auth, updateUser, startPhoneVerification, confirmPhoneVerification, isLoading } = useUser();
  const [phoneNumber, setPhoneNumber] = useState(user?.phone || '');
  const [isVerificationSent, setIsVerificationSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState(0);
  const [timeoutId, setTimeoutId] = useState<number | null>(null);
  const { toast } = useToast();
  
  // Set verification UI state based on auth context
  useEffect(() => {
    if (auth.isVerifying) {
      setIsVerificationSent(true);
    }
  }, [auth.isVerifying]);
  
  // Handle session timeout countdown
  useEffect(() => {
    if (isVerificationSent) {
      // Start countdown for session timeout
      const sessionTimeout = getVerificationSessionTimeout();
      setSessionTimeRemaining(sessionTimeout);
      
      // Update the remaining time every second
      const intervalId = window.setInterval(() => {
        const timeRemaining = getVerificationSessionTimeRemaining();
        setSessionTimeRemaining(timeRemaining);
        
        // When time expires, show timeout message
        if (timeRemaining <= 0) {
          setError('Verification session has expired. Please request a new code.');
          setIsVerificationSent(false);
          clearInterval(intervalId);
          
          toast({
            title: "Session expired",
            description: "Your verification session has timed out. Please request a new code.",
            variant: "destructive",
          });
        }
      }, 1000);
      
      // Clean up interval on unmount
      return () => {
        clearInterval(intervalId);
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      };
    }
  }, [isVerificationSent, toast, timeoutId]);
  
  const handleSendCode = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      setError('Please enter a valid phone number');
      handleValidationError(
        'Please enter a valid phone number', 
        { phoneNumber, length: phoneNumber.length },
        true
      );
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
          description: auth.isDemoMode ? "For demo purposes, the code is 1234" : "Please enter the code sent to your phone",
          variant: "default",
        });
        
        // Clear success message after a few seconds
        const id = window.setTimeout(() => {
          setSuccess('');
        }, 3000);
        setTimeoutId(id);
      } else {
        setError('Failed to send verification code. Please try again with a valid phone number.');
        toast({
          title: "Verification failed",
          description: "Could not send verification code. Please check your phone number.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Phone verification error:", err);
      setError('An unexpected error occurred. Please try again.');
      toast({
        title: "Verification error",
        description: "An unexpected error occurred. Please try again later.",
        variant: "destructive",
      });
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
    setError('');
    
    try {
      const success = await startPhoneVerification(phoneNumber);
      
      if (success) {
        // Show a user-friendly message
        setSuccess('A new code has been sent to your phone');
        toast({
          title: "Code resent",
          description: auth.isDemoMode ? "For demo purposes, the code is 1234" : "A new verification code has been sent",
          variant: "default",
        });
        
        // Clear success message after a few seconds
        const id = window.setTimeout(() => {
          setSuccess('');
        }, 3000);
        setTimeoutId(id);
      } else {
        setError('Failed to resend code. Please check your phone number.');
        toast({
          title: "Resend failed",
          description: "Could not resend verification code. Please try again.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Resend code error:", err);
      setError('An unexpected error occurred. Please try again later.');
      setTimeout(() => {
        setError('');
      }, 3000);
    }
  };
  
  const formatRemainingTime = (milliseconds: number): string => {
    if (milliseconds <= 0) return '0:00';
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  const handleVerifyCode = async (code?: string) => {
    // Check if session has expired
    if (sessionTimeRemaining <= 0) {
      setError('Verification session has expired. Please request a new code.');
      toast({
        title: "Session expired",
        description: "Your verification session has timed out. Please request a new code.",
        variant: "destructive",
      });
      setIsVerificationSent(false);
      return;
    }
    
    const codeToVerify = code || verificationCode.join('');
    if (codeToVerify.length !== 4) {
      setError('Please enter a valid 4-digit code');
      handleValidationError('Invalid verification code format', { codeLength: codeToVerify.length }, true);
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
        setError(`Invalid verification code. ${auth.verificationAttemptsRemaining} attempts remaining.`);
        toast({
          title: "Verification failed",
          description: auth.isDemoMode 
            ? "Please use code 1234 for this demo" 
            : `Invalid code. ${auth.verificationAttemptsRemaining} attempts remaining.`,
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Verification error:", err);
      setError('Verification failed. Please try again.');
      toast({
        title: "Error",
        description: "Verification failed due to an unexpected error.",
        variant: "destructive",
      });
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
    sessionTimeRemaining,
    formatRemainingTime,
    handleSendCode,
    handleVerificationCodeChange,
    handleResendCode,
    handleVerifyCode
  };
};
