
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/context/UserContext';
import OnboardingScreen from '@/components/wireframes/screens/OnboardingScreen';
import Layout from '@/components/Layout';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { smsPermissionService } from '@/services/SmsPermissionService';

const Onboarding = () => {
  const navigate = useNavigate();
  const { user, auth, updateUser, checkProfileCompletion } = useUser();
  const { toast } = useToast();
  const [smsPermissionStatus, setSmsPermissionStatus] = useState<boolean>(false);
  
  // Redirect to dashboard if user has already completed onboarding
  useEffect(() => {
    if (user?.completedOnboarding) {
      navigate('/dashboard');
    }
  }, [user, navigate]);
  
  // Redirect to signup if no user exists or user hasn't started registration
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

  // Check SMS permission status when component mounts
  useEffect(() => {
    const checkSmsPermissions = async () => {
      // Only check permissions in native environments
      if (smsPermissionService.isNativeEnvironment()) {
        const hasPermission = await smsPermissionService.hasPermission();
        console.log('SMS permission status:', hasPermission ? 'granted' : 'not granted');
        setSmsPermissionStatus(hasPermission);
      }
    };
    
    checkSmsPermissions();
  }, []);
  
  const handleOnboardingComplete = async () => {
    // Check if SMS permissions were granted during onboarding
    const smsPermissionGranted = await smsPermissionService.hasPermission();
    
    // Mark onboarding as complete
    updateUser({ 
      completedOnboarding: true,
      smsPermissionGranted
    });
    
    // Check if profile is complete
    const profileStatus = checkProfileCompletion();
    
    // Navigate based on profile completion
    if (!profileStatus.isComplete) {
      // If profile is not complete, redirect to profile page
      toast({
        title: "Complete your profile",
        description: "Please fill in your profile information to continue.",
      });
      navigate('/profile');
    } else {
      // If profile is complete, notify user and navigate to dashboard
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
      
      navigate('/dashboard');
    }
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
