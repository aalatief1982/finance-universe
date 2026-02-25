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
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import OnboardingSlides from '@/onboarding/OnboardingSlides';
import { logAnalyticsEvent } from '@/utils/firebase-analytics';

const Onboarding = () => {
  const navigate = useNavigate();
  const [showSmsPrompt, setShowSmsPrompt] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasCompletedRef = useRef(false);

  // Cleanup timeout on unmount
  useEffect(() => {
    console.trace('[TRACE][Onboarding] component mounted', {
      timestamp: new Date().toISOString(),
    });
    const timeoutId = timeoutRef.current;

    return () => {
      if (timeoutId) {
        console.trace('[TRACE][Onboarding] clearing timeout on unmount', {
          timestamp: new Date().toISOString(),
        });
        clearTimeout(timeoutId);
      }
    };
  }, []);

  useEffect(() => {
    console.log('showSmsPrompt state changed:', showSmsPrompt);
  }, [showSmsPrompt]);

  const handleComplete = () => {
    if (hasCompletedRef.current) return;
    hasCompletedRef.current = true;

    console.log('Onboarding completed');
    safeStorage.setItem('xpensia_onb_done', 'true');
    safeStorage.setItem('xpensia_onb_just_completed', 'true'); // New flag
    
    // Log onboarding completion
    logAnalyticsEvent('onboarding_complete', {
      platform: Capacitor.getPlatform(),
      timestamp: Date.now()
    });
    
    timeoutRef.current = setTimeout(() => {
      navigate('/home', { replace: true });
    }, 250);
  };

  return (
    <div className="fixed inset-0 overflow-hidden">
      <OnboardingSlides onComplete={handleComplete} />
    </div>
  );
};

export default Onboarding;
