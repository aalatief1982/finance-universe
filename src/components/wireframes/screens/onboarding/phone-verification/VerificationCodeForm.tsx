
import React from 'react';
import { Phone, Loader2, Info } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import WireframeButton from '../../../WireframeButton';

interface VerificationCodeFormProps {
  phoneNumber: string;
  verificationCode: string[];
  handleVerificationCodeChange: (value: string) => void;
  handleResendCode: () => void;
  handleVerifyCode: () => void;
  isLoading: boolean;
  error: string;
  errorType?: 'network' | 'validation' | 'auth' | null;
  success: string;
  sessionTimeRemaining?: number;
  formatRemainingTime?: (milliseconds: number) => string;
  isOffline?: boolean;
}

const VerificationCodeForm = ({
  phoneNumber,
  verificationCode,
  handleVerificationCodeChange,
  handleResendCode,
  handleVerifyCode,
  isLoading,
  error,
  errorType,
  success,
  sessionTimeRemaining,
  formatRemainingTime,
  isOffline
}: VerificationCodeFormProps) => {
  return (
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
        
        {sessionTimeRemaining && formatRemainingTime && (
          <div className="mt-2 text-sm font-medium">
            Time remaining: {formatRemainingTime(sessionTimeRemaining)}
          </div>
        )}
      </div>
      
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
        <div className="flex items-start">
          <Info className="h-5 w-5 text-amber-500 mt-0.5 mr-2" />
          <div>
            <p className="text-sm font-medium text-amber-800">Demo Info</p>
            <p className="text-xs text-amber-700">
              For this demo, please use code: <span className="font-bold">1234</span>
            </p>
          </div>
        </div>
      </div>
      
      <div className="flex justify-center mb-6">
        <InputOTP
          maxLength={4}
          value={verificationCode.join('')}
          onChange={handleVerificationCodeChange}
          disabled={isOffline}
        >
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
            <InputOTPSlot index={3} />
          </InputOTPGroup>
        </InputOTP>
      </div>
      
      <div className="text-center">
        <button 
          className="text-primary hover:text-primary/80 text-sm font-medium underline" 
          onClick={handleResendCode}
          type="button"
          disabled={isLoading || isOffline}
        >
          Didn't receive a code? Resend
        </button>
      </div>
      
      <div className="mt-6">
        <WireframeButton 
          onClick={handleVerifyCode}
          variant={verificationCode.every(digit => digit) ? 'primary' : 'secondary'}
          disabled={isLoading || !verificationCode.every(digit => digit) || isOffline}
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
  );
};

export default VerificationCodeForm;
