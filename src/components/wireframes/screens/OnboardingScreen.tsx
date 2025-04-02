import React, { useState, useEffect } from 'react';
import WireframeContainer from '../WireframeContainer';
import WelcomeScreen from './onboarding/WelcomeScreen';
import SecondScreen from './onboarding/SecondScreen';
import ThirdScreen from './onboarding/ThirdScreen';
import FinalScreen from './onboarding/FinalScreen';
import UserProfileScreen from './onboarding/UserProfileScreen';
import PhoneVerificationScreen from './onboarding/PhoneVerificationScreen';
import SmsProviderSelectionScreen from './onboarding/SmsProviderSelectionScreen';
import { useUser } from '@/context/UserContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';

interface OnboardingScreenProps {
  onNext?: () => void;
  userData?: any;
  onUpdateUserData?: (data: any) => void;
}

const OnboardingScreen = ({ onNext, userData, onUpdateUserData }: OnboardingScreenProps = {}) => {
  const [step, setStep] = useState(0);
  const { user, updateUser, logIn } = useUser();
  const navigate = useNavigate();
  const { toast } = useToast();
  
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
  
  const handleSecondScreenComplete = () => {
    setStep(2);
  };
  
  const handleThirdScreenComplete = () => {
    setStep(3);
  };
  
  const handleFinalScreenComplete = () => {
    setStep(4);
  };
  
  const handlePhoneVerificationComplete = () => {
    setStep(5);
    toast({
      title: "Phone verified",
      description: "Your phone number has been successfully verified"
    });
  };
  
  const handleProfileComplete = (profileData: any) => {
    // Create a timestamp for account creation
    const createdAt = new Date();
    
    updateUser({
      ...profileData,
      hasProfile: true,
      createdAt
    });
    
    setStep(6);
    
    toast({
      title: "Profile created",
      description: "Your profile has been set up successfully"
    });
  };
  
  const handleSmsProviderSelectionComplete = (providers: string[]) => {
    updateUser({
      smsProviders: providers,
      completedOnboarding: true
    });
    
    // Complete login process
    logIn();
    
    toast({
      title: "Setup complete",
      description: "Your account is ready to use"
    });
    
    // If the parent component provided an onNext callback, call it
    if (onNext) {
      onNext();
    } else {
      // Otherwise, navigate to dashboard
      navigate('/dashboard');
    }
  };
  
  const handleSkipSmsSelection = () => {
    updateUser({
      smsProviders: [],
      completedOnboarding: true
    });
    
    // Complete login process
    logIn();
    
    toast({
      title: "Setup complete",
      description: "You can configure SMS providers later"
    });
    
    // If the parent component provided an onNext callback, call it
    if (onNext) {
      onNext();
    } else {
      // Otherwise, navigate to dashboard
      navigate('/dashboard');
    }
  };
  
  const renderCurrentStep = () => {
    switch (step) {
      case 0:
        return <WelcomeScreen onNext={handleWelcomeComplete} />;
      case 1:
        return <SecondScreen onNext={handleSecondScreenComplete} />;
      case 2:
        return <ThirdScreen onNext={handleThirdScreenComplete} />;
      case 3:
        return <FinalScreen onNext={handleFinalScreenComplete} />;
      case 4:
        return <PhoneVerificationScreen onNext={handlePhoneVerificationComplete} />;
      case 5:
        return <UserProfileScreen onComplete={handleProfileComplete} />;
      case 6:
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
        <div className="max-w-md mx-auto w-full h-full">
          {renderCurrentStep()}
        </div>
      </div>
    </WireframeContainer>
  );
};

export default OnboardingScreen;
