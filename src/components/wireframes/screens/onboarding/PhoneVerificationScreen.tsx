
import React from 'react';
import { motion } from 'framer-motion';
import EnterPhoneForm from './phone-verification/EnterPhoneForm';
import VerificationCodeForm from './phone-verification/VerificationCodeForm';
import { usePhoneVerification } from './phone-verification/usePhoneVerification';
import { Check, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';

interface PhoneVerificationScreenProps {
  onNext: () => void;
}

const PhoneVerificationScreen = ({ onNext }: PhoneVerificationScreenProps) => {
  const { toast } = useToast();
  const {
    phoneNumber,
    setPhoneNumber,
    isVerificationSent,
    verificationCode,
    error,
    success,
    isLoading,
    handleSendCode,
    handleVerificationCodeChange,
    handleResendCode,
    handleVerifyCode
  } = usePhoneVerification((phone) => {
    toast({
      title: "Verification successful",
      description: `Phone ${phone} has been verified`,
    });
    onNext();
  });

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      {success && (
        <Alert className="bg-green-50 border-green-200">
          <Check className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">{success}</AlertDescription>
        </Alert>
      )}
      
      {error && (
        <Alert variant="destructive" className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!isVerificationSent ? (
        <EnterPhoneForm
          phoneNumber={phoneNumber}
          setPhoneNumber={setPhoneNumber}
          handleSendCode={handleSendCode}
          isLoading={isLoading}
          error={error}
          success={success}
        />
      ) : (
        <VerificationCodeForm
          phoneNumber={phoneNumber}
          verificationCode={verificationCode}
          handleVerificationCodeChange={handleVerificationCodeChange}
          handleResendCode={handleResendCode}
          handleVerifyCode={() => handleVerifyCode()}
          isLoading={isLoading}
          error={error}
          success={success}
        />
      )}
    </motion.div>
  );
};

export default PhoneVerificationScreen;
