
import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUser } from '@/context/UserContext';
import WireframeButton from '../../WireframeButton';

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
  
  const handleSendCode = () => {
    if (!phoneNumber) {
      setError('Please enter a valid phone number');
      return;
    }
    
    setError('');
    setIsVerificationSent(true);
    // Update the user context with the phone number
    updateUser({ phone: phoneNumber });
    // In a real app, this would send a verification code to the phone number
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
        onNext();
      }, 1000); // Simulate verification delay
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
    setError('A new code has been sent to your phone');
    setTimeout(() => {
      setError('');
    }, 3000);
  };

  return (
    <div className="space-y-4">
      {!isVerificationSent ? (
        <>
          <div className="mb-4">
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
          </div>
          <WireframeButton onClick={handleSendCode}>Send Verification Code</WireframeButton>
        </>
      ) : (
        <>
          <div className="text-center mb-4">
            <p className="text-gray-700 mb-1">Enter the 4-digit code sent to</p>
            <p className="font-bold">{phoneNumber}</p>
            {error && <p className="text-blue-500 text-sm mt-2">{error}</p>}
          </div>
          
          <div className="flex justify-center space-x-2 mb-6">
            {verificationCode.map((digit, index) => (
              <Input
                key={index}
                id={`code-input-${index}`}
                type="text"
                className="w-12 h-12 text-center text-xl"
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
              className="text-blue-600 underline" 
              onClick={handleResendCode}
              type="button"
            >
              Resend Code
            </button>
          </div>
          
          <div className="mt-4">
            <WireframeButton 
              onClick={onNext}
              variant={verificationCode.every(digit => digit) ? 'primary' : 'secondary'}
              disabled={isVerifying}
            >
              {isVerifying ? 'Verifying...' : 'Verify and Continue'}
            </WireframeButton>
          </div>
        </>
      )}
    </div>
  );
};

export default PhoneVerificationScreen;
