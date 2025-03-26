
import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUser } from '@/context/UserContext';
import WireframeButton from '../../WireframeButton';
import { motion } from 'framer-motion';
import { Phone } from 'lucide-react';

interface PhoneVerificationScreenProps {
  onNext: () => void;
}

const PhoneVerificationScreen = ({ onNext }: PhoneVerificationScreenProps) => {
  const { user, updateUser } = useUser();
  const [phoneNumber, setPhoneNumber] = useState(user?.phone || '');
  const [isVerificationSent, setIsVerificationSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState(['', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const handleSendCode = () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }
    
    setError('');
    setIsVerificationSent(true);
    setSuccess('Verification code sent successfully!');
    
    // Update the user context with the phone number
    updateUser({ phone: phoneNumber });
    
    // In a real app, this would send a verification code to the phone number
    // For demo, we'll just simulate a success message
    setTimeout(() => {
      setSuccess('');
    }, 3000);
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
    
    // Check if all inputs are filled
    if (newCode.every(digit => digit) && newCode.join('').length === 4) {
      // In a real app, verify the code here
      setIsVerifying(true);
      setTimeout(() => {
        setIsVerifying(false);
        setSuccess('Phone number verified successfully!');
        // Wait a moment before proceeding to next step
        setTimeout(() => {
          onNext();
        }, 1000);
      }, 1500); // Simulate verification delay
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

  const handleResendCode = () => {
    // Reset verification code
    setVerificationCode(['', '', '', '']);
    // In a real app, this would resend the verification code
    
    // Show a user-friendly message
    setSuccess('A new code has been sent to your phone');
    setTimeout(() => {
      setSuccess('');
    }, 3000);
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
          >
            Send Verification Code
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
            >
              Didn't receive a code? Resend
            </button>
          </div>
          
          <div className="mt-6">
            <WireframeButton 
              onClick={onNext}
              variant={verificationCode.every(digit => digit) ? 'primary' : 'secondary'}
              disabled={isVerifying || !verificationCode.every(digit => digit)}
              className="w-full"
            >
              {isVerifying ? 'Verifying...' : 'Verify and Continue'}
            </WireframeButton>
          </div>
        </>
      )}
    </motion.div>
  );
};

export default PhoneVerificationScreen;
