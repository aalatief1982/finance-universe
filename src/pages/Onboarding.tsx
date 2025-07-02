import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import OnboardingSlides from '@/onboarding/OnboardingSlides';

const Onboarding = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      event.preventDefault();
      window.history.pushState(null, '', window.location.href);
    };

    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const handleComplete = () => {
    localStorage.setItem('xpensia_onb_done', 'true');
    navigate('/home');
  };

  return (
    <Layout hideNavigation showHeader={false} withPadding={false} fullWidth>
      <OnboardingSlides onComplete={handleComplete} />
    </Layout>
  );
};

export default Onboarding;
