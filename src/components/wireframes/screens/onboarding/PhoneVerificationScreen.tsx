
import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUser } from '@/context/UserContext';
import WireframeButton from '../../WireframeButton';
import { motion } from 'framer-motion';
import { Phone, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

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
          description: "Please check your phone for the verification code",
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
  
  const handleVerificationCodeChange = (index: number, value: string) => {
    if (value.length > 1) return; // Only allow one character per input
    
    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);
    
    // Auto-focus next input if current one is filled
    if (value && index < 3) {
      const nextInput = document.getElementById(`code-input-${index + 1}`);
      if (nextInput) {
        nextInput.focus();
      }
    }
    
    // Check if all inputs are filled for auto-verification
    if (newCode.every(digit => digit) && newCode.join('').length === 4) {
      handleVerifyCode();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    // Handle backspace to go to previous input
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      const prevInput = document.getElementById(`code-input-${index - 1}`);
      if (prevInput) {
        prevInput.focus();
      }
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
          description: "A new verification code has been sent to your phone",
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
  
  const handleVerifyCode = async () => {
    const code = verificationCode.join('');
    if (code.length !== 4) {
      setError('Please enter a valid 4-digit code');
      return;
    }
    
    try {
      const success = await confirmPhoneVerification(code);
      
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
          
          <div className="flex justify-center space-x-3 mb-6">
            {verificationCode.map((digit, index) => (
              <Input
                key={index}
                id={`code-input-${index}`}
                type="text"
                className="w-14 h-14 text-center text-xl font-semibold"
                maxLength={1}
                value={digit}
                onChange={(e) => handleVerificationCodeChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                autoFocus={index === 0 && isVerificationSent}
              />
            ))}
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
              onClick={handleVerifyCode}
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
