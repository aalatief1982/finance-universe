
import React, { useState } from 'react';
import WireframeButton from '../../WireframeButton';

interface PhoneVerificationScreenProps {
  onNext: () => void;
}

const PhoneVerificationScreen = ({ onNext }: PhoneVerificationScreenProps) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isVerificationSent, setIsVerificationSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState(['', '', '', '']);
  
  const handleSendCode = () => {
    if (!phoneNumber) return;
    setIsVerificationSent(true);
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
      setTimeout(onNext, 500); // Simulate verification
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

  return (
    <div className="space-y-4">
      {!isVerificationSent ? (
        <>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Enter Mobile Number</label>
            <input 
              type="tel" 
              placeholder="+1 (000) 000-0000" 
              className="w-full p-2 border rounded-lg"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          </div>
          <WireframeButton onClick={handleSendCode}>Send Verification Code</WireframeButton>
        </>
      ) : (
        <>
          <div className="text-center mb-4">
            <p className="text-gray-700 mb-1">Enter the 4-digit code sent to</p>
            <p className="font-bold">{phoneNumber}</p>
          </div>
          
          <div className="flex justify-center space-x-2 mb-6">
            {verificationCode.map((digit, index) => (
              <input
                key={index}
                id={`code-input-${index}`}
                type="text"
                className="w-12 h-12 text-center text-xl border rounded-lg"
                maxLength={1}
                value={digit}
                onChange={(e) => handleVerificationCodeChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, index)}
              />
            ))}
          </div>
          
          <div className="text-center">
            <button className="text-blue-600 underline">Resend Code</button>
          </div>
          
          <div className="mt-4">
            <WireframeButton 
              onClick={onNext}
              variant={verificationCode.every(digit => digit) ? 'primary' : 'secondary'}
            >
              Verify and Continue
            </WireframeButton>
          </div>
        </>
      )}
    </div>
  );
};

export default PhoneVerificationScreen;
