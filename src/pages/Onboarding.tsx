
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/context/UserContext';
import OnboardingScreen from '@/components/wireframes/screens/OnboardingScreen';
import Layout from '@/components/Layout';
import { motion } from 'framer-motion';

const Onboarding = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  
  // Redirect to dashboard if user has already completed onboarding
  React.useEffect(() => {
    if (user?.completedOnboarding) {
      navigate('/dashboard');
    }
  }, [user, navigate]);
  
  const handleOnboardingComplete = () => {
    navigate('/dashboard');
  };
  
  return (
    <Layout hideNavigation>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="min-h-screen"
      >
        <OnboardingScreen onNext={handleOnboardingComplete} />
      </motion.div>
    </Layout>
  );
};

export default Onboarding;
