import React, { useState, useEffect, KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/context/UserContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, Loader2, Clock, Phone } from 'lucide-react';
import { 
  getVerificationSessionTimeRemaining,
  getVerificationAttemptsRemaining 
} from '@/lib/supabase-auth';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Progress } from '@/components/ui/progress';

interface PhoneVerificationProps {
  onVerificationComplete?: () => void;
  hidePhoneInput?: boolean;
}

const PhoneVerification = ({ 
  onVerificationComplete,
  hidePhoneInput = false 
}: PhoneVerificationProps) => {
  const { user, startPhoneVerification, confirmPhoneVerification, auth } = useUser();
  const [phoneNumber, setPhoneNumber] = useState(user?.phone || '');
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerificationSent, setIsVerificationSent] = useState(!!user?.phone);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorType, setErrorType] = useState<'network' | 'validation' | 'auth' | null>(null);
  const [success, setSuccess] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [attemptsRemaining, setAttemptsRemaining] = useState(5);
  const { toast } = useToast();

  // Initialize with phone number from user context if available
  useEffect(() => {
    if (user?.phone) {
      setPhoneNumber(user.phone);
      
      // If coming from signup flow, automatically trigger verification
      if (hidePhoneInput && !user.phoneVerified) {
        handleSendCode();
      }
    }
  }, [user, hidePhoneInput]);

  // Update timer when verification is sent
  useEffect(() => {
    let timerId: number | null = null;
    
    if (isVerificationSent) {
      setAttemptsRemaining(getVerificationAttemptsRemaining());
      
      timerId = window.setInterval(() => {
        const remaining = getVerificationSessionTimeRemaining();
        setTimeRemaining(remaining);
        
        if (remaining <= 0) {
          clearInterval(timerId!);
          setError('Verification session has expired. Please request a new code.');
          setErrorType('auth');
          toast({
            title: 'Session Expired',
            description: 'Your verification session has timed out. Please request a new code.',
            variant: 'destructive',
          });
        }
      }, 1000);
    }
    
    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [isVerificationSent, toast]);

  // Validation function for phone number
  const validatePhoneNumber = (number: string): boolean => {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(number.replace(/\s+/g, ''));
  };

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

  const formatTime = (ms: number): string => {
    if (ms <= 0) return '0:00';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Get progress percentage for timeout
  const getTimeoutProgress = () => {
    if (!timeRemaining) return 0;
    // Assuming session timeout is 15 minutes (900,000 ms)
    const totalDuration = 15 * 60 * 1000;
    return Math.max(0, Math.min(100, (timeRemaining / totalDuration) * 100));
  };

  // Get progress color based on remaining time
  const getProgressColor = () => {
    if (!timeRemaining) return 'bg-muted';
    
    // Less than 1 minute - urgent (red)
    if (timeRemaining < 60000) return 'bg-red-600';
    // Less than 3 minutes - warning (amber)
    if (timeRemaining < 180000) return 'bg-amber-600';
    // Otherwise normal (green)
    return 'bg-green-600';
  };

  // Determine time warning color
  const getTimeWarningColor = () => {
    if (!timeRemaining) return 'text-muted-foreground';
    
    // Less than 1 minute - urgent (red)
    if (timeRemaining < 60000) return 'text-red-600';
    // Less than 3 minutes - warning (amber)
    if (timeRemaining < 180000) return 'text-amber-600';
    // Otherwise normal (green)
    return 'text-green-600';
  };

  const handleSendCode = async () => {
    // If phone number is already saved and we're hiding input, use it directly
    const phoneToVerify = hidePhoneInput ? user?.phone || phoneNumber : phoneNumber;
    
    if (!phoneToVerify || !validatePhoneNumber(phoneToVerify)) {
      setError('Please enter a valid phone number with country code');
      setErrorType('validation');
      toast({
        title: 'Invalid phone number',
        description: 'Please enter a valid phone number with country code',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setError('');
    setErrorType(null);
    try {
      const success = await startPhoneVerification(phoneToVerify);
      
      if (success) {
        setIsVerificationSent(true);
        setSuccess('Verification code sent successfully!');
        toast({
          title: 'Verification code sent',
          description: 'For demo purposes, the code is 1234',
        });
        
        // Clear success message after a few seconds
        setTimeout(() => {
          setSuccess('');
        }, 5000);
      } else {
        throw new Error('Failed to send verification code');
      }
    } catch (err) {
      console.error('Error sending code:', err);
      setError('Failed to send code. Please check your phone number and try again.');
      setErrorType('network');
      toast({
        title: 'Failed to send code',
        description: 'Please check your phone number and try again later',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 4) {
      setError('Please enter a valid 4-digit code');
      setErrorType('validation');
      toast({
        title: 'Invalid code',
        description: 'Please enter a valid 4-digit code',
        variant: 'destructive',
      });
      return;
    }

    if (timeRemaining <= 0) {
      setError('Verification session has expired. Please request a new code.');
      setErrorType('auth');
      toast({
        title: 'Session expired',
        description: 'Your verification session has timed out. Please request a new code.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setError('');
    setErrorType(null);
    try {
      const success = await confirmPhoneVerification(verificationCode);
      
      if (success) {
        setSuccess('Phone number verified successfully!');
        toast({
          title: 'Phone verified',
          description: 'Your phone number has been verified',
        });
        
        if (onVerificationComplete) {
          setTimeout(() => {
            onVerificationComplete();
          }, 1500);
        }
      } else {
        // Update attempts remaining
        setAttemptsRemaining(getVerificationAttemptsRemaining());
        
        // Show error message with attempts remaining
        throw new Error(`Invalid verification code. ${attemptsRemaining} attempts remaining.`);
      }
    } catch (err) {
      console.error('Verification error:', err);
      setVerificationCode('');
      setError(`Invalid code. ${attemptsRemaining} attempts remaining.`);
      setErrorType('validation');
      toast({
        title: 'Verification failed',
        description: `Invalid code. ${attemptsRemaining} attempts remaining. For this demo, use 1234.`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = () => {
    setVerificationCode('');
    setError('');
    setErrorType(null);
    handleSendCode();
  };

  // Handle Enter key press for phone input 
  const handlePhoneKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isLoading && !isVerificationSent) {
      e.preventDefault();
      handleSendCode();
    }
  };

  // Handle keydown events for more accessible verification code submission
  const handleCodeKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    // If all digits are filled and user presses Enter, submit the code
    if (e.key === 'Enter' && verificationCode.length === 4 && !isLoading) {
      e.preventDefault();
      handleVerifyCode();
    }
  };

  // For screen readers to announce status changes
  const getAriaLiveText = () => {
    if (isLoading) return 'Loading, please wait...';
    if (success) return success;
    if (error) return error;
    return '';
  };

  return (
    <Card role="region" aria-label="Phone verification form">
      <CardHeader>
        <CardTitle className="text-xl">Phone Verification</CardTitle>
        <CardDescription>
          {!isVerificationSent
            ? 'Enter your phone number to receive a verification code'
            : 'Enter the verification code sent to your phone'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Success Message */}
        {success && (
          <Alert className="mb-4 bg-green-50 border-green-200" role="status" aria-live="polite">
            <CheckCircle2 className="h-4 w-4 text-green-600" aria-hidden="true" />
            <AlertTitle className="text-green-800">Success</AlertTitle>
            <AlertDescription className="text-green-700">{success}</AlertDescription>
          </Alert>
        )}
        
        {/* Error Message */}
        {error && (
          <Alert variant="destructive" className="mb-4" role="alert" aria-live="assertive">
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {/* Hidden status for screen readers */}
        <div aria-live="polite" className="sr-only">
          {getAriaLiveText()}
        </div>
        
        {!isVerificationSent ? (
          <div className="space-y-4">
            {!hidePhoneInput && (
              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium" id="phone-label">Phone Number</label>
                <div className="relative">
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1234567890"
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                    onKeyDown={handlePhoneKeyDown}
                    className={error && errorType === 'validation' ? "border-red-300 focus-visible:ring-red-400" : ""}
                    aria-labelledby="phone-label"
                    aria-describedby="phone-hint phone-error"
                    aria-invalid={error && errorType === 'validation' ? 'true' : 'false'}
                    autoComplete="tel"
                  />
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <Phone className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  </div>
                </div>
                <p id="phone-hint" className="text-xs text-muted-foreground">
                  Include country code (e.g., +1 for US)
                </p>
                
                {phoneNumber && !phoneNumber.startsWith('+') && (
                  <div className="mt-2 bg-amber-50 border border-amber-200 rounded p-2 text-xs" 
                       id="phone-format-hint"
                       role="note"
                       aria-live="polite">
                    <p className="font-medium text-amber-700">International Format Required</p>
                    <p className="text-amber-600">
                      Example: +1 for US/Canada, +44 for UK, +61 for Australia
                    </p>
                  </div>
                )}
                
                {error && errorType === 'validation' && (
                  <p id="phone-error" className="text-xs text-red-500" aria-live="assertive">
                    {error}
                  </p>
                )}
              </div>
            )}
            <Button
              className="w-full"
              onClick={handleSendCode}
              disabled={isLoading}
              aria-busy={isLoading}
              aria-describedby={hidePhoneInput ? '' : 'phone-hint'}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  <span>Sending...</span>
                </>
              ) : (
                'Send Verification Code'
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Session timer indicator */}
            <div 
              className="mb-4 border rounded-lg p-3 bg-gray-50" 
              role="timer" 
              aria-label={`Session expires in ${formatTime(timeRemaining)}`}
              aria-live="polite"
            >
              <div className="flex items-center space-x-2">
                <Clock className={`h-4 w-4 ${getTimeWarningColor()}`} aria-hidden="true" />
                <span className={`text-sm font-medium ${getTimeWarningColor()}`}>
                  Session expires in: {formatTime(timeRemaining)}
                </span>
              </div>
              <div className="mt-2">
                <Progress 
                  value={getTimeoutProgress()} 
                  className="h-2" 
                  indicatorClassName={getProgressColor()}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={getTimeoutProgress()}
                  aria-label={`${getTimeoutProgress()}% time remaining`}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="code" className="text-sm font-medium" id="code-label">
                Verification Code
              </label>
              <div 
                className="flex justify-center py-2"
                onKeyDown={handleCodeKeyDown}
                role="group"
                aria-labelledby="code-label"
                tabIndex={0}
              >
                <InputOTP
                  maxLength={4}
                  value={verificationCode}
                  onChange={setVerificationCode}
                  render={({ slots }) => (
                    <InputOTPGroup>
                      {slots.map((slot, index) => (
                        <InputOTPSlot 
                          key={index} 
                          index={index} 
                          {...slot} 
                          className={error ? "border-red-300" : success ? "border-green-300" : ""}
                          aria-label={`Digit ${index + 1}`}
                        />
                      ))}
                    </InputOTPGroup>
                  )}
                />
              </div>
              
              <div className="flex justify-between">
                <p className="text-xs text-muted-foreground" id="code-hint">
                  Enter the 4-digit code sent to {hidePhoneInput ? user?.phone : phoneNumber}
                </p>
                <p className="text-xs text-muted-foreground" aria-live="polite">
                  Attempts remaining: <span aria-label={`${attemptsRemaining} attempts remaining`}>{attemptsRemaining}</span>
                </p>
              </div>
            </div>
            
            {/* Demo Info */}
            <Alert 
              className="bg-amber-50 border-amber-200" 
              role="note"
              aria-label="Demo information"
            >
              <AlertDescription className="text-amber-800 text-sm">
                For this demo, please use code: <span className="font-bold">1234</span>
              </AlertDescription>
            </Alert>
            
            <Button
              className={`w-full ${success ? 'bg-green-600 hover:bg-green-700' : ''}`}
              onClick={handleVerifyCode}
              disabled={isLoading || timeRemaining <= 0}
              aria-busy={isLoading}
              aria-describedby="code-hint"
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
                'Verify Code'
              )}
            </Button>
          </div>
        )}
      </CardContent>
      {isVerificationSent && (
        <CardFooter className="flex justify-between">
          {!hidePhoneInput && (
            <Button 
              variant="ghost" 
              onClick={() => setIsVerificationSent(false)}
              aria-label="Change phone number"
            >
              Change Phone Number
            </Button>
          )}
          <Button 
            variant="ghost" 
            onClick={handleResendCode} 
            disabled={isLoading || timeRemaining > 0}
            className={hidePhoneInput ? "ml-auto" : ""}
            aria-label="Resend verification code"
            aria-disabled={isLoading || timeRemaining > 0}
          >
            Resend Code
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default PhoneVerification;
