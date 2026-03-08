/**
 * @file Onboarding.tsx
 * @description Page component for Onboarding.
 *
 * @module pages/Onboarding
 *
 * @responsibilities
 * 1. Compose layout and section components
 * 2. Load data or invoke services for the page
 * 3. Handle navigation and page-level actions
 *
 * @review-tags
 * - @ui: page composition
 *
 * @review-checklist
 * - [ ] Data loading handles empty states
 * - [ ] Navigation hooks are wired correctly
 */
import { safeStorage } from "@/utils/safe-storage";
import { setDefaultCurrencyRequired } from '@/utils/default-currency';
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import OnboardingSlides from '@/onboarding/OnboardingSlides';
import { logAnalyticsEvent } from '@/utils/firebase-analytics';

const Onboarding = () => {
  const navigate = useNavigate();
  const [showSmsPrompt, setShowSmsPrompt] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasCompletedRef = useRef(false);
  const hasNavigatedRef = useRef(false);
  const navigationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    // [REMOVABLE-DEBUG-TOAST] Toast 9
    toast({ title: `[DBG-FLICKER] 9: Onboarding mounted | t=${performance.now().toFixed(0)}` });
    console.trace('[TRACE][Onboarding] component mounted', {
      timestamp: new Date().toISOString(),
    });
    return () => {
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }

      console.trace('[TRACE][Onboarding] component unmounted', {
        timestamp: new Date().toISOString(),
      });
    };
  }, []);

  useEffect(() => {
    console.log('showSmsPrompt state changed:', showSmsPrompt);
  }, [showSmsPrompt]);

  const handleComplete = () => {
    if (hasCompletedRef.current || hasNavigatedRef.current || isSubmitting) return;

    setIsSubmitting(true);
    hasCompletedRef.current = true;

    console.log('Onboarding completed');
    safeStorage.setItem('xpensia_onb_done', 'true');
    safeStorage.setItem('xpensia_onb_just_completed', 'true'); // New flag
    setDefaultCurrencyRequired(true);
    
    // Log onboarding completion
    logAnalyticsEvent('onboarding_complete', {
      platform: Capacitor.getPlatform(),
      timestamp: Date.now()
    });
    
    if (!hasNavigatedRef.current) {
      hasNavigatedRef.current = true;
      navigationTimeoutRef.current = setTimeout(() => {
        navigate('/home', { replace: true });
      }, 180);
    }
  };

  return (
    <div className="fixed inset-0 overflow-hidden">
      <OnboardingSlides onComplete={handleComplete} isSubmitting={isSubmitting} />
    </div>
  );
};

export default Onboarding;
