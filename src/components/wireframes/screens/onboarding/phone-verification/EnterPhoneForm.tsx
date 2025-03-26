
import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Phone, Loader2 } from 'lucide-react';
import WireframeButton from '../../../WireframeButton';

interface EnterPhoneFormProps {
  phoneNumber: string;
  setPhoneNumber: (phone: string) => void;
  handleSendCode: () => void;
  isLoading: boolean;
  error: string;
  success: string;
}

const EnterPhoneForm = ({ 
  phoneNumber, 
  setPhoneNumber, 
  handleSendCode, 
  isLoading,
  error,
  success
}: EnterPhoneFormProps) => {
  return (
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
  );
};

export default EnterPhoneForm;
