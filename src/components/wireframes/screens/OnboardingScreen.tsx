
import React, { useState, useEffect } from 'react';
import WireframeContainer from '../WireframeContainer';
import WelcomeScreen from './onboarding/WelcomeScreen';
import PhoneVerificationScreen from './onboarding/PhoneVerificationScreen';
import UserProfileScreen from './onboarding/UserProfileScreen';
import SmsProviderSelectionScreen from './onboarding/SmsProviderSelectionScreen';
import { useUser } from '@/context/UserContext';
import { useNavigate } from 'react-router-dom';

const OnboardingScreen = () => {
  const [step, setStep] = useState(0);
  const { user, updateUser, logIn } = useUser();
  const navigate = useNavigate();
  
  // Reset onboarding to step 0 when component mounts
  useEffect(() => {
    // Check if user already completed onboarding
    if (user && user.completedOnboarding) {
      navigate('/dashboard');
    }
  }, [user, navigate]);
  
  const handleWelcomeComplete = () => {
    setStep(1);
  };
  
  const handlePhoneVerificationComplete = () => {
    setStep(2);
  };
  
  const handleProfileComplete = (profileData: any) => {
    updateUser({
      ...profileData,
      hasProfile: true
    });
    setStep(3);
  };
  
  const handleSmsProviderSelectionComplete = (providers: string[]) => {
    updateUser({
      smsProviders: providers,
      completedOnboarding: true
    });
    
    // Complete login process
    logIn();
    
    // Navigate to dashboard
    navigate('/dashboard');
  };
  
  const handleSkipSmsSelection = () => {
    updateUser({
      smsProviders: [],
      completedOnboarding: true
    });
    
    // Complete login process
    logIn();
    
    // Navigate to dashboard
    navigate('/dashboard');
  };
  
  const renderCurrentStep = () => {
    switch (step) {
      case 0:
        return <WelcomeScreen onNext={handleWelcomeComplete} />;
      case 1:
        return <PhoneVerificationScreen onNext={handlePhoneVerificationComplete} />;
      case 2:
        return <UserProfileScreen onComplete={handleProfileComplete} />;
      case 3:
        return (
          <SmsProviderSelectionScreen 
            onComplete={handleSmsProviderSelectionComplete}
            onSkip={handleSkipSmsSelection}
          />
        );
      default:
        return <WelcomeScreen onNext={handleWelcomeComplete} />;
    }
  };
  
  return (
    <WireframeContainer>
      <div className="p-4 h-full flex flex-col justify-center">
        <div className="max-w-md mx-auto w-full">
          {renderCurrentStep()}
        </div>
      </div>
    </WireframeContainer>
  );
};

export default OnboardingScreen;
