
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/context/UserContext';
import OnboardingScreen from '@/components/wireframes/screens/OnboardingScreen';
import Layout from '@/components/Layout';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { smsPermissionService } from '@/services/SmsPermissionService';

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
  

  // Check SMS permission status when component mounts
  useEffect(() => {
    const checkSmsPermissions = async () => {
      // Only check permissions in native environments
      if (smsPermissionService.isNativeEnvironment()) {
        const hasPermission = smsPermissionService.hasPermission();
        console.log('SMS permission status:', hasPermission ? 'granted' : 'not granted');
      }
    };
    
    checkSmsPermissions();
  }, []);
  
  const handleOnboardingComplete = () => {
    // Check if SMS permissions were granted during onboarding
    const smsPermissionGranted = smsPermissionService.hasPermission();
    
    // Mark onboarding as complete
    updateUser({ 
      completedOnboarding: true,
      smsPermissionGranted
    });
    
    // Notify user with appropriate message based on permission status
    if (smsPermissionService.isNativeEnvironment() && smsPermissionGranted) {
      toast({
        title: "Setup complete!",
        description: "Your account is ready to use with SMS tracking enabled.",
      });
    } else {
      toast({
        title: "Setup complete!",
        description: "Your account is ready to use.",
      });
    }
    
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
