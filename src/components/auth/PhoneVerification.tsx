
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { useUser } from '@/context/UserContext';

interface PhoneVerificationProps {
  onVerificationComplete?: () => void;
}

const PhoneVerification = ({ onVerificationComplete }: PhoneVerificationProps) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerificationSent, setIsVerificationSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { startPhoneVerification, confirmPhoneVerification } = useUser();
  const { toast } = useToast();

  const handleSendCode = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      toast({
        title: 'Invalid phone number',
        description: 'Please enter a valid phone number',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    const success = await startPhoneVerification(phoneNumber);
    setIsLoading(false);

    if (success) {
      setIsVerificationSent(true);
      toast({
        title: 'Verification code sent',
        description: 'For demo purposes, the code is 1234',
      });
    } else {
      toast({
        title: 'Failed to send code',
        description: 'Please try again later',
        variant: 'destructive',
      });
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 4) {
      toast({
        title: 'Invalid code',
        description: 'Please enter a valid 4-digit code',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    const success = await confirmPhoneVerification(verificationCode);
    setIsLoading(false);

    if (success) {
      toast({
        title: 'Phone verified',
        description: 'Your phone number has been verified',
      });
      
      if (onVerificationComplete) {
        onVerificationComplete();
      }
    } else {
      toast({
        title: 'Invalid code',
        description: 'Please check the code and try again. For this demo, use 1234.',
        variant: 'destructive',
      });
    }
  };

  const handleResendCode = () => {
    setVerificationCode('');
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
        {!isVerificationSent ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1234567890"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Include country code (e.g., +1 for US)
              </p>
            </div>
            <Button
              className="w-full"
              onClick={handleSendCode}
              disabled={isLoading}
            >
              {isLoading ? 'Sending...' : 'Send Verification Code'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Verification Code</Label>
              <Input
                id="code"
                type="text"
                placeholder="1234"
                maxLength={4}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Enter the 4-digit code sent to {phoneNumber}
              </p>
            </div>
            <Button
              className="w-full"
              onClick={handleVerifyCode}
              disabled={isLoading}
            >
              {isLoading ? 'Verifying...' : 'Verify Code'}
            </Button>
          </div>
        )}
      </CardContent>
      {isVerificationSent && (
        <CardFooter className="flex justify-between">
          <Button variant="ghost" onClick={() => setIsVerificationSent(false)}>
            Change Phone Number
          </Button>
          <Button variant="ghost" onClick={handleResendCode} disabled={isLoading}>
            Resend Code
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default PhoneVerification;
