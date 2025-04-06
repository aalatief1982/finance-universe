import React from 'react';
import { Phone, Loader2, Info, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import WireframeButton from '../../../WireframeButton';
import { Progress } from '@/components/ui/progress';

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
  // Calculate progress percentage for timeout
  const getTimeoutProgress = () => {
    if (!sessionTimeRemaining) return 0;
    // Assuming session timeout is 15 minutes (900,000 ms)
    const totalDuration = 15 * 60 * 1000;
    return Math.max(0, Math.min(100, (sessionTimeRemaining / totalDuration) * 100));
  };

  // Determine time warning color based on remaining time
  const getTimeWarningColor = () => {
    if (!sessionTimeRemaining) return 'text-muted-foreground';
    
    // Less than 1 minute - urgent (red)
    if (sessionTimeRemaining < 60000) return 'text-red-600';
    // Less than 3 minutes - warning (amber)
    if (sessionTimeRemaining < 180000) return 'text-amber-600';
    // Otherwise normal (green)
    return 'text-green-600';
  };

  // Get progress color based on remaining time
  const getProgressColor = () => {
    if (!sessionTimeRemaining) return 'bg-muted';
    
    // Less than 1 minute - urgent (red)
    if (sessionTimeRemaining < 60000) return 'bg-red-600';
    // Less than 3 minutes - warning (amber)
    if (sessionTimeRemaining < 180000) return 'bg-amber-600';
    // Otherwise normal (green)
    return 'bg-green-600';
  };

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
        
        {success && (
          <div className="mt-2 flex items-center justify-center space-x-1 text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            <p className="text-sm font-medium">{success}</p>
          </div>
        )}
        
        {error && (
          <div className="mt-2 flex items-center justify-center space-x-1 text-red-600">
            <AlertCircle className="h-4 w-4" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}
        
        {sessionTimeRemaining && formatRemainingTime && (
          <div className="mt-4 border rounded-lg p-3 bg-gray-50">
            <div className="flex items-center space-x-2">
              <Clock className={`h-4 w-4 ${getTimeWarningColor()}`} />
              <span className={`text-sm font-medium ${getTimeWarningColor()}`}>
                Session expires in: {formatRemainingTime(sessionTimeRemaining)}
              </span>
            </div>
            <div className="mt-2">
              <Progress 
                value={getTimeoutProgress()} 
                className="h-2" 
                indicatorClassName={getProgressColor()}
              />
            </div>
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
          disabled={isOffline || isLoading}
          className={error ? "has-error" : success ? "has-success" : ""}
        >
          <InputOTPGroup>
            <InputOTPSlot 
              index={0} 
              className={error ? "border-red-500" : success ? "border-green-500" : ""} 
            />
            <InputOTPSlot 
              index={1} 
              className={error ? "border-red-500" : success ? "border-green-500" : ""} 
            />
            <InputOTPSlot 
              index={2} 
              className={error ? "border-red-500" : success ? "border-green-500" : ""} 
            />
            <InputOTPSlot 
              index={3} 
              className={error ? "border-red-500" : success ? "border-green-500" : ""} 
            />
          </InputOTPGroup>
        </InputOTP>
      </div>
      
      {isOffline && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-2" />
            <div>
              <p className="text-sm font-medium text-red-800">You're offline</p>
              <p className="text-xs text-red-700">
                Please check your internet connection and try again
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="text-center">
        <button 
          className={`text-primary hover:text-primary/80 text-sm font-medium underline
            ${(isLoading || isOffline) ? 'opacity-50 cursor-not-allowed' : ''}
          `}
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
          className={`w-full transition-all duration-300 ${
            success ? 'bg-green-600 hover:bg-green-700' : ''
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying...
            </>
          ) : success ? (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Verified!
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
