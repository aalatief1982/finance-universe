import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/context/UserContext';
import OnboardingScreen from '@/components/wireframes/screens/OnboardingScreen';
import Layout from '@/components/Layout';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

const Onboarding = () => {
  const navigate = useNavigate();
  const { user, auth, updateUser } = useUser();
  const { toast } = useToast();
  
  // Redirect to dashboard if user has already completed onboarding
  useEffect(() => {
    if (user?.completedOnboarding) {
      navigate('/dashboard');
    }
  }, [user, navigate]);
  
  // Redirect to signup if no user exists
  useEffect(() => {
    if (!auth.isAuthenticated && !user && !auth.isVerifying) {
      toast({
        title: "Please register first",
        description: "You need to register before completing onboarding.",
        variant: "destructive"
      });
      navigate('/signup');
    }
  }, [auth.isAuthenticated, auth.isVerifying, user, navigate, toast]);
  
  const handleOnboardingComplete = () => {
    // Mark onboarding as complete
    updateUser({ completedOnboarding: true });
    
    // Notify user
    toast({
      title: "Setup complete!",
      description: "Your account is ready to use.",
    });
    
    // Navigate to dashboard
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
