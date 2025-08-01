import { safeStorage } from "@/utils/safe-storage";
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import OnboardingSlides from '@/onboarding/OnboardingSlides';

const Onboarding = () => {
  const navigate = useNavigate();

  const handleComplete = () => {
    safeStorage.setItem('xpensia_onb_done', 'true');
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
