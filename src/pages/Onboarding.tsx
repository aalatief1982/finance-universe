import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import OnboardingSlides from '@/onboarding/OnboardingSlides';

const Onboarding = () => {
  const navigate = useNavigate();

  const handleComplete = () => {
    localStorage.setItem('xpensia_onb_done', 'true');
    navigate('/home');
  };

  return (
    <Layout hideNavigation>
      <OnboardingSlides onComplete={handleComplete} />
    </Layout>
  );
};

export default Onboarding;
