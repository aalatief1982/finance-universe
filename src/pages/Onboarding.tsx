import { safeStorage } from "@/utils/safe-storage";
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import Layout from '@/components/Layout';
import OnboardingSlides from '@/onboarding/OnboardingSlides';
import { logAnalyticsEvent } from '@/utils/firebase-analytics';

const Onboarding = () => {
  const navigate = useNavigate();
  const [showSmsPrompt, setShowSmsPrompt] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    console.log('Onboarding component mounted');

    return () => {
      if (timeoutRef.current) {
        console.log('Clearing timeout on unmount');
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    console.log('showSmsPrompt state changed:', showSmsPrompt);
  }, [showSmsPrompt]);

  const handleComplete = () => {
    console.log('Onboarding completed');
    safeStorage.setItem('xpensia_onb_done', 'true');
    safeStorage.setItem('xpensia_onb_just_completed', 'true'); // New flag
    
    // Log onboarding completion
    logAnalyticsEvent('onboarding_complete', {
      platform: Capacitor.getPlatform(),
      timestamp: Date.now()
    });
    
    navigate('/home');
  };

  return (
    <Layout
      hideNavigation
      showHeader={false}
      withPadding={false}
      fullWidth
      className="w-full overflow-hidden"
      safeAreaPadding={false}
    >
      <OnboardingSlides onComplete={handleComplete} />
    </Layout>
  );
};

export default Onboarding;
