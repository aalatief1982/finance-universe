import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Phone, Loader2, AlertCircle, Check } from 'lucide-react';
import WireframeButton from '../../../WireframeButton';

interface EnterPhoneFormProps {
  phoneNumber: string;
  setPhoneNumber: (phone: string) => void;
  handleSendCode: () => void;
  isLoading: boolean;
  error: string;
  errorType?: 'network' | 'validation' | 'auth' | null;
  success: string;
  isOffline?: boolean;
  validatePhoneNumber?: (number: string) => boolean;
}

const EnterPhoneForm = ({ 
  phoneNumber, 
  setPhoneNumber, 
  handleSendCode, 
  isLoading,
  error,
  errorType,
  success,
  isOffline,
  validatePhoneNumber
}: EnterPhoneFormProps) => {
  const [validationState, setValidationState] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [validationHint, setValidationHint] = useState('');
  
  // Check validation on phone number change
  useEffect(() => {
    if (!phoneNumber) {
      setValidationState('idle');
      setValidationHint('');
      return;
    }
    
    // If we have a custom validation function, use it
    if (validatePhoneNumber) {
      if (validatePhoneNumber(phoneNumber)) {
        setValidationState('valid');
        setValidationHint('');
      } else {
        setValidationState('invalid');
        // Provide hint based on common formatting issues
        if (!phoneNumber.startsWith('+')) {
          setValidationHint('Phone number should start with "+" followed by country code');
        } else if (phoneNumber.length < 8) {
          setValidationHint('Phone number is too short');
        } else if (/[a-zA-Z]/.test(phoneNumber)) {
          setValidationHint('Phone number should only contain digits, "+", and spaces');
        } else {
          setValidationHint('Please enter a valid international phone number');
        }
      }
      return;
    }
    
    // Basic validation if no custom validator provided
    const basicRegex = /^\+?[1-9]\d{6,14}$/;
    if (basicRegex.test(phoneNumber.replace(/\s+/g, ''))) {
      setValidationState('valid');
      setValidationHint('');
    } else {
      setValidationState('invalid');
      if (!phoneNumber.startsWith('+')) {
        setValidationHint('Phone number should start with "+" followed by country code');
      } else if (phoneNumber.length < 8) {
        setValidationHint('Phone number is too short');
      } else {
        setValidationHint('Please enter a valid international phone number');
      }
    }
  }, [phoneNumber, validatePhoneNumber]);
  
  // Format phone number as user types
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // Allow only digits, +, spaces, parentheses, and hyphens
    value = value.replace(/[^\d+\s()-]/g, '');
    
    // Ensure only one + at the beginning
    if (value.indexOf('+') > 0) {
      value = value.replace(/\+/g, '');
      value = '+' + value;
    }
    
    setPhoneNumber(value);
  };
  
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
        <div className="relative">
          <Input 
            id="phone-number"
            type="tel" 
            placeholder="+1 (000) 000-0000" 
            value={phoneNumber}
            onChange={handlePhoneChange}
            className={`${
              error ? "border-red-500" : 
              validationState === 'valid' ? "border-green-500 pe-10" : 
              validationState === 'invalid' ? "border-amber-500 pe-10" : ""
            }`}
            disabled={isOffline}
          />
          {validationState === 'valid' && !error && (
            <div className="absolute inset-y-0 right-0 flex items-center pe-3 pointer-events-none">
              <Check className="h-5 w-5 text-green-500" />
            </div>
          )}
          {validationState === 'invalid' && !error && (
            <div className="absolute inset-y-0 right-0 flex items-center pe-3 pointer-events-none">
              <AlertCircle className="h-5 w-5 text-amber-500" />
            </div>
          )}
        </div>
        
        {validationHint && !error && validationState === 'invalid' && (
          <p className="text-amber-500 text-sm mt-1">{validationHint}</p>
        )}
        
        {validationState === 'valid' && !error && (
          <p className="text-green-500 text-sm mt-1">Valid phone number format</p>
        )}
        
        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        {success && <p className="text-green-500 text-sm mt-1">{success}</p>}
        
        {phoneNumber && !phoneNumber.startsWith('+') && validationState === 'invalid' && (
          <div className="mt-2 bg-amber-50 border border-amber-200 rounded p-2 text-sm">
            <p className="font-medium text-amber-700">International Format Required</p>
            <p className="text-amber-600">
              Example: +1 for US/Canada, +44 for UK, +61 for Australia
            </p>
          </div>
        )}
        
        {isOffline && (
          <p className="text-red-500 text-sm mt-1">You are currently offline. Please check your connection.</p>
        )}
      </div>
      
      <WireframeButton 
        onClick={handleSendCode}
        variant="primary"
        className="w-full"
        disabled={isLoading || isOffline || (validationState === 'invalid' && phoneNumber.length > 0)}
      >
        {isLoading ? (
          <>
            <Loader2 className="me-2 h-4 w-4 animate-spin" />
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
