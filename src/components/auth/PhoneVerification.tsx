import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/context/UserContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, Loader2, Clock } from 'lucide-react';
import { 
  getVerificationSessionTimeRemaining,
  getVerificationAttemptsRemaining 
} from '@/lib/supabase-auth';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

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

  const formatTime = (ms: number): string => {
    if (ms <= 0) return '0:00';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSendCode = async () => {
    // If phone number is already saved and we're hiding input, use it directly
    const phoneToVerify = hidePhoneInput ? user?.phone || phoneNumber : phoneNumber;
    
    if (!phoneToVerify || phoneToVerify.length < 10) {
      setError('Please enter a valid phone number');
      toast({
        title: 'Invalid phone number',
        description: 'Please enter a valid phone number with country code',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setError('');
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
      toast({
        title: 'Invalid code',
        description: 'Please enter a valid 4-digit code',
        variant: 'destructive',
      });
      return;
    }

    if (timeRemaining <= 0) {
      setError('Verification session has expired. Please request a new code.');
      toast({
        title: 'Session expired',
        description: 'Your verification session has timed out. Please request a new code.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setError('');
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
    handleSendCode();
  };

  return (
    <Card>
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
          <Alert className="mb-4 bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Success</AlertTitle>
            <AlertDescription className="text-green-700">{success}</AlertDescription>
          </Alert>
        )}
        
        {/* Error Message */}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {!isVerificationSent ? (
          <div className="space-y-4">
            {!hidePhoneInput && (
              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium">Phone Number</label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1234567890"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className={error ? "border-red-300 focus-visible:ring-red-400" : ""}
                />
                <p className="text-xs text-muted-foreground">
                  Include country code (e.g., +1 for US)
                </p>
              </div>
            )}
            <Button
              className="w-full"
              onClick={handleSendCode}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Verification Code'
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Session timer indicator */}
            <div className="flex justify-center mb-2">
              <div className="text-sm text-muted-foreground flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                <span>Session expires in: <span className="font-medium">{formatTime(timeRemaining)}</span></span>
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="code" className="text-sm font-medium">Verification Code</label>
              <div className="flex justify-center py-2">
                <InputOTP
                  maxLength={4}
                  value={verificationCode}
                  onChange={setVerificationCode}
                  render={({ slots }) => (
                    <InputOTPGroup>
                      {slots.map((slot, index) => (
                        <InputOTPSlot key={index} index={index} {...slot} />
                      ))}
                    </InputOTPGroup>
                  )}
                />
              </div>
              
              <div className="flex justify-between">
                <p className="text-xs text-muted-foreground">
                  Enter the 4-digit code sent to {hidePhoneInput ? user?.phone : phoneNumber}
                </p>
                <p className="text-xs text-muted-foreground">
                  Attempts remaining: {attemptsRemaining}
                </p>
              </div>
            </div>
            
            {/* Demo Info */}
            <Alert className="bg-amber-50 border-amber-200">
              <AlertDescription className="text-amber-800 text-sm">
                For this demo, please use code: <span className="font-bold">1234</span>
              </AlertDescription>
            </Alert>
            
            <Button
              className="w-full"
              onClick={handleVerifyCode}
              disabled={isLoading || timeRemaining <= 0}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
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
            <Button variant="ghost" onClick={() => setIsVerificationSent(false)}>
              Change Phone Number
            </Button>
          )}
          <Button 
            variant="ghost" 
            onClick={handleResendCode} 
            disabled={isLoading || timeRemaining > 0}
            className={hidePhoneInput ? "ml-auto" : ""}
          >
            Resend Code
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default PhoneVerification;
