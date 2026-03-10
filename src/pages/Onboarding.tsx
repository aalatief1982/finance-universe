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
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import OnboardingSlides from '@/onboarding/OnboardingSlides';
import { logAnalyticsEvent } from '@/utils/firebase-analytics';

const Onboarding = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showSmsPrompt, setShowSmsPrompt] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasCompletedRef = useRef(false);
  const hasNavigatedRef = useRef(false);
  const navigationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // [REMOVABLE-FLICKER-DIAG] Read diagnostic mode from URL param
  const flickerDiag = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const val = parseInt(params.get('flickerDiag') || '0', 10);
    return (val >= 1 && val <= 3) ? val : 0;
  }, [location.search]);

  // Cleanup timeout on unmount
  useEffect(() => {
    console.trace('[TRACE][Onboarding] component mounted', {
      timestamp: new Date().toISOString(),
    });
    if (DEBUG_STARTUP) window.alert(`[XPENSIA DEBUG #9] Onboarding Page Mounted\nTime: ${performance.now().toFixed(2)}ms`);
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

  // [REMOVABLE-FLICKER-DIAG] Variant 1: static placeholder
  if (flickerDiag === 1) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-background via-background to-muted/30 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-primary/20 rounded-2xl mx-auto" />
          <h1 className="text-2xl font-bold text-foreground">Static Placeholder</h1>
          <p className="text-muted-foreground">No image, no animation, no Swiper</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 overflow-hidden">
      <OnboardingSlides onComplete={handleComplete} isSubmitting={isSubmitting} flickerDiag={flickerDiag} />
    </div>
  );
};

export default Onboarding;
