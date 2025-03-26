
import React, { useState } from 'react';
import WireframeContainer from '../WireframeContainer';
import WireframeHeader from '../WireframeHeader';
import WelcomeScreen from './onboarding/WelcomeScreen';
import PhoneVerificationScreen from './onboarding/PhoneVerificationScreen';
import ProfileCreationScreen from './onboarding/ProfileCreationScreen';

interface UserData {
  name?: string;
  email?: string;
  phone?: string;
  smsProviders?: string[];
}

interface OnboardingScreenProps {
  onNext: () => void;
  userData: UserData;
  onUpdateUserData: (data: Partial<UserData>) => void;
}

const OnboardingScreen = ({ onNext, userData, onUpdateUserData }: OnboardingScreenProps) => {
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  
  const screenTitles = ['Welcome', 'Phone Verification', 'Profile Creation'];
  
  const handleNext = () => {
    if (step < 2) {
      setStep(step + 1);
    } else {
      // Validate before completing onboarding
      if (validateProfileData()) {
        onNext();
      }
    }
  };

  const validateProfileData = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!userData.name) {
      newErrors.name = 'Name is required';
    }
    
    if (!userData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(userData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return <WelcomeScreen onNext={handleNext} />;
      case 1:
        return (
          <PhoneVerificationScreen 
            onNext={handleNext} 
          />
        );
      case 2:
        return (
          <ProfileCreationScreen 
            onComplete={handleNext}
            userData={userData}
            onUpdateUserData={onUpdateUserData}
            errors={errors}
          />
        );
      default:
        return <WelcomeScreen onNext={handleNext} />;
    }
  };

  return (
    <WireframeContainer>
      <WireframeHeader title={screenTitles[step]} />
      {renderStep()}
    </WireframeContainer>
  );
};

export default OnboardingScreen;
