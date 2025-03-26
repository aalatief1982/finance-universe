
import React from 'react';
import WireframeButton from '../../WireframeButton';

interface PhoneVerificationScreenProps {
  onNext: () => void;
}

const PhoneVerificationScreen = ({ onNext }: PhoneVerificationScreenProps) => {
  return (
    <div>
      <div className="mb-4">
        <label className="block text-gray-700 mb-2">Enter Mobile Number</label>
        <input 
          type="tel" 
          placeholder="+1 (000) 000-0000" 
          className="w-full p-2 border rounded-lg"
        />
      </div>
      <WireframeButton onClick={onNext}>Send Verification Code</WireframeButton>
    </div>
  );
};

export default PhoneVerificationScreen;
