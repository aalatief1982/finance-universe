
import { useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { useToast } from '@/hooks/use-toast';
import { 
  getVerificationSessionTimeout, 
  getVerificationSessionTimeRemaining 
} from '@/lib/supabase-auth';
import { handleError } from '@/utils/error-utils';
import { ErrorType } from '@/types/error';

export const usePhoneVerification = (onNext: () => void) => {
  const { user, auth, updateUser, startPhoneVerification, confirmPhoneVerification, isLoading } = useUser();
  const [phoneNumber, setPhoneNumber] = useState(user?.phone || '');
  const [isVerificationSent, setIsVerificationSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [errorType, setErrorType] = useState<'network' | 'validation' | 'auth' | null>(null);
  const [success, setSuccess] = useState('');
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState(0);
  const [timeoutId, setTimeoutId] = useState<number | null>(null);
  const [networkStatus, setNetworkStatus] = useState<'online' | 'offline'>('online');
  const { toast } = useToast();
  
  // Monitor network status
  useEffect(() => {
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
          setErrorType('auth');
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

  // Phone number validation function
  const validatePhoneNumber = (number: string): boolean => {
    // Basic international phone number validation - can be extended for more comprehensive validation
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(number.replace(/\s+/g, ''));
  };
  
  const handleSendCode = async () => {
    // Clear previous errors
    setError('');
    setErrorType(null);
    
    // Check network status first
    if (networkStatus === 'offline') {
      setError('You appear to be offline. Please check your internet connection and try again.');
      setErrorType('network');
      
      handleError({
        type: ErrorType.NETWORK,
        message: 'Cannot send verification code while offline', 
        context: { phoneNumber, networkStatus }
      });
      
      toast({
        title: "Network error",
        description: "You appear to be offline. Please check your internet connection.",
        variant: "destructive",
      });
      return;
    }
    
    // Validate phone number
    if (!phoneNumber || !validatePhoneNumber(phoneNumber)) {
      const errorMsg = 'Please enter a valid phone number with country code (e.g., +1234567890)';
      setError(errorMsg);
      setErrorType('validation');
      
      handleError({
        type: ErrorType.VALIDATION,
        message: errorMsg,
        context: { phoneNumber, isValid: validatePhoneNumber(phoneNumber) }
      });
      
      toast({
        title: "Invalid phone number",
        description: errorMsg,
        variant: "destructive",
      });
      return;
    }
    
    try {
      const formattedPhoneNumber = phoneNumber.replace(/\s+/g, '');
      const success = await startPhoneVerification(formattedPhoneNumber);
      
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
        setErrorType('auth');
        
        toast({
          title: "Verification failed",
          description: "Could not send verification code. Please check your phone number.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Phone verification error:", err);
      setError('An unexpected error occurred. Please try again.');
      setErrorType('network');
      
      handleError({
        type: ErrorType.AUTH,
        message: 'Failed to initiate phone verification', 
        context: { phoneNumber },
        originalError: err
      });
      
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
    setErrorType(null);
    
    // Check network status first
    if (networkStatus === 'offline') {
      setError('You appear to be offline. Please check your internet connection and try again.');
      setErrorType('network');
      
      handleError({
        type: ErrorType.NETWORK,
        message: 'Cannot resend verification code while offline', 
        context: { phoneNumber, networkStatus }
      });
      
      toast({
        title: "Network error",
        description: "You appear to be offline. Please check your internet connection.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const formattedPhoneNumber = phoneNumber.replace(/\s+/g, '');
      const success = await startPhoneVerification(formattedPhoneNumber);
      
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
        setErrorType('auth');
        
        toast({
          title: "Resend failed",
          description: "Could not resend verification code. Please try again.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Resend code error:", err);
      setError('An unexpected error occurred. Please try again later.');
      setErrorType('network');
      
      handleError({
        type: ErrorType.NETWORK,
        message: 'Failed to resend verification code', 
        context: { phoneNumber },
        originalError: err
      });
      
      setTimeout(() => {
        setError('');
        setErrorType(null);
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
    // Check network status first
    if (networkStatus === 'offline') {
      setError('You appear to be offline. Please check your internet connection and try again.');
      setErrorType('network');
      
      handleError({
        type: ErrorType.NETWORK,
        message: 'Cannot verify code while offline', 
        context: { phoneNumber, networkStatus }
      });
      
      toast({
        title: "Network error",
        description: "You appear to be offline. Please check your internet connection.",
        variant: "destructive",
      });
      return;
    }
    
    // Check if session has expired
    if (sessionTimeRemaining <= 0) {
      setError('Verification session has expired. Please request a new code.');
      setErrorType('auth');
      
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
      setErrorType('validation');
      
      handleError({
        type: ErrorType.VALIDATION,
        message: 'Invalid verification code format', 
        context: { codeLength: codeToVerify.length }
      });
      return;
    }
    
    try {
      const success = await confirmPhoneVerification(codeToVerify);
      
      if (success) {
        setSuccess('Phone number verified successfully!');
        setError('');
        setErrorType(null);
        
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
        setErrorType('validation');
        
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
      setErrorType('network');
      
      handleError({
        type: ErrorType.AUTH,
        message: 'Failed to confirm verification code', 
        context: { attemptsRemaining: auth.verificationAttemptsRemaining },
        originalError: err
      });
      
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
  };
};
