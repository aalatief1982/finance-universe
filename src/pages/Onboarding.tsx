import { safeStorage } from "@/utils/safe-storage";
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import Layout from '@/components/Layout';
import OnboardingSlides from '@/onboarding/OnboardingSlides';
import SmsPermissionPrompt from '@/components/SmsPermissionPrompt';

const Onboarding = () => {
  const navigate = useNavigate();
  const [showSmsPrompt, setShowSmsPrompt] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleComplete = () => {
    safeStorage.setItem('xpensia_onb_done', 'true');
    navigate('/home');

    // Only show SMS prompt on native Android and if not already shown
    const isNative = Capacitor.isNativePlatform();
    const isAndroid = Capacitor.getPlatform() === 'android';
    const alreadyPrompted = safeStorage.getItem('sms_prompt_shown') === 'true';

    if (isNative && isAndroid && !alreadyPrompted) {
      timeoutRef.current = setTimeout(() => {
        setShowSmsPrompt(true);
      }, 5000);
    }
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
      <SmsPermissionPrompt 
        open={showSmsPrompt} 
        onOpenChange={setShowSmsPrompt} 
      />
    </Layout>
  );
};

export default Onboarding;
