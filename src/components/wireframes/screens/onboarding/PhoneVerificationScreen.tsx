
import React from 'react';
import { motion } from 'framer-motion';
import EnterPhoneForm from './phone-verification/EnterPhoneForm';
import VerificationCodeForm from './phone-verification/VerificationCodeForm';
import { usePhoneVerification } from './phone-verification/usePhoneVerification';

interface PhoneVerificationScreenProps {
  onNext: () => void;
}

const PhoneVerificationScreen = ({ onNext }: PhoneVerificationScreenProps) => {
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
  } = usePhoneVerification(onNext);

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
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
