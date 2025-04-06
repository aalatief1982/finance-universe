
import React, { KeyboardEvent } from 'react';
import { Phone, Loader2, Info, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import WireframeButton from '../../../WireframeButton';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

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
  
  // Handle keyboard navigation for verification form
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && verificationCode.every(digit => digit) && !isLoading) {
      e.preventDefault();
      handleVerifyCode();
    }
  };
  
  // Function to get aria-live text for screen readers
  const getAriaLiveText = () => {
    if (isLoading) return 'Verifying code, please wait...';
    if (success) return success;
    if (error) return error;
    if (isOffline) return 'You are currently offline. Please check your internet connection.';
    return '';
  };

  return (
    <div role="region" aria-label="Verification code form">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4" aria-hidden="true">
          <Phone className="h-8 w-8 text-primary" aria-hidden="true" />
        </div>
        <h3 className="text-lg font-medium" id="verification-title">Enter Verification Code</h3>
        <p className="text-sm text-muted-foreground mt-1" id="verification-description">
          Enter the 4-digit code sent to <span className="font-medium">{phoneNumber}</span>
        </p>
        
        {/* Hidden status announcer for screen readers */}
        <div aria-live="polite" className="sr-only" role="status">
          {getAriaLiveText()}
        </div>
        
        {success && (
          <div className="mt-2 flex items-center justify-center space-x-1 text-green-600" 
               role="status" 
               aria-live="polite">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            <p className="text-sm font-medium">{success}</p>
          </div>
        )}
        
        {error && (
          <div className="mt-2 flex items-center justify-center space-x-1 text-red-600" 
               role="alert" 
               aria-live="assertive">
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}
        
        {sessionTimeRemaining && formatRemainingTime && (
          <div 
            className="mt-4 border rounded-lg p-3 bg-gray-50" 
            role="timer" 
            aria-label={`Session expires in ${formatRemainingTime(sessionTimeRemaining)}`}
            aria-live="polite"
          >
            <div className="flex items-center space-x-2">
              <Clock className={`h-4 w-4 ${getTimeWarningColor()}`} aria-hidden="true" />
              <span className={`text-sm font-medium ${getTimeWarningColor()}`} id="timer-value">
                Session expires in: {formatRemainingTime(sessionTimeRemaining)}
              </span>
            </div>
            <div className="mt-2">
              <Progress 
                value={getTimeoutProgress()} 
                className="h-2" 
                indicatorClassName={getProgressColor()}
                aria-labelledby="timer-value"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={getTimeoutProgress()}
              />
            </div>
          </div>
        )}
      </div>
      
      <div 
        className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4" 
        role="note"
        aria-label="Demo information"
      >
        <div className="flex items-start">
          <Info className="h-5 w-5 text-amber-500 mt-0.5 mr-2" aria-hidden="true" />
          <div>
            <p className="text-sm font-medium text-amber-800">Demo Info</p>
            <p className="text-xs text-amber-700">
              For this demo, please use code: <span className="font-bold">1234</span>
            </p>
          </div>
        </div>
      </div>
      
      <div 
        className="flex justify-center mb-6" 
        onKeyDown={handleKeyDown}
        role="group"
        aria-labelledby="verification-title"
        aria-describedby="verification-description"
      >
        <InputOTP
          maxLength={4}
          value={verificationCode.join('')}
          onChange={handleVerificationCodeChange}
          disabled={isOffline || isLoading}
          className={error ? "has-error" : success ? "has-success" : ""}
          aria-invalid={!!error}
        >
          <InputOTPGroup>
            {[0, 1, 2, 3].map((index) => (
              <InputOTPSlot 
                key={index} 
                index={index} 
                className={error ? "border-red-500" : success ? "border-green-500" : ""} 
                aria-label={`Digit ${index + 1}`}
              />
            ))}
          </InputOTPGroup>
        </InputOTP>
      </div>
      
      {isOffline && (
        <div 
          className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4" 
          role="alert"
          aria-live="assertive"
        >
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-2" aria-hidden="true" />
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
          aria-label="Resend verification code"
          aria-disabled={isLoading || isOffline}
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
          aria-busy={isLoading}
          aria-disabled={isLoading || !verificationCode.every(digit => digit) || isOffline}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              <span>Verifying...</span>
            </>
          ) : success ? (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" aria-hidden="true" />
              <span>Verified!</span>
            </>
          ) : (
            "Verify and Continue"
          )}
        </WireframeButton>
      </div>
    </div>
  );
};

export default VerificationCodeForm;
