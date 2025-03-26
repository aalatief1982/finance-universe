
import React, { useState } from 'react';
import WireframeContainer from '../WireframeContainer';
import WireframeHeader from '../WireframeHeader';
import WelcomeScreen from './onboarding/WelcomeScreen';
import PhoneVerificationScreen from './onboarding/PhoneVerificationScreen';
import ProfileCreationScreen from './onboarding/ProfileCreationScreen';

interface OnboardingScreenProps {
  onNext: () => void;
}

const OnboardingScreen = ({ onNext }: OnboardingScreenProps) => {
  const [step, setStep] = useState(0);
  
  const screenTitles = ['Welcome', 'Phone Verification', 'Profile Creation'];
  
  const handleNext = () => {
    setStep(step + 1);
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return <WelcomeScreen onNext={handleNext} />;
      case 1:
        return <PhoneVerificationScreen onNext={handleNext} />;
      case 2:
        return <ProfileCreationScreen onComplete={onNext} />;
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
