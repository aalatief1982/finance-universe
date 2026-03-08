/**
 * @file AppLoader.tsx
 * @description UI component for AppLoader.
 *
 * @module components/AppLoader
 *
 * @responsibilities
 * 1. Render UI for the feature area
 * 2. Accept props and emit user interactions
 * 3. Compose shared subcomponents where needed
 *
 * @review-tags
 * - @ui: visual/layout behavior
 *
 * @review-checklist
 * - [ ] Props have sensible defaults
 * - [ ] Component renders without crashing
 */
import React, { useState, useEffect } from 'react';
import { SplashScreen } from './SplashScreen';
import { toast } from '@/hooks/use-toast'; // [REMOVABLE-DEBUG-TOAST]

const TRACE_PREFIX = '[TRACE][APP_ROOT]';
let traceCounter = 0;
const traceAppRoot = (message: string, ...args: unknown[]) => {
  traceCounter += 1;
  const now = performance.now().toFixed(2);
  console.log(`${TRACE_PREFIX}[${traceCounter}][${now}ms] ${message}`, ...args);
};

interface AppLoaderProps {
  children: React.ReactNode;
  isInitializing: boolean;
}

export const AppLoader: React.FC<AppLoaderProps> = ({ children, isInitializing }) => {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    traceAppRoot('AppLoader mounted');
    // [REMOVABLE-DEBUG-TOAST] Toast 3
    toast({ title: `[DBG-FLICKER] 3: AppLoader mounted | initializing=${isInitializing} | t=${performance.now().toFixed(0)}` });

    return () => {
      traceAppRoot('AppLoader unmounted');
    };
  }, []);

  useEffect(() => {
    traceAppRoot(`AppLoader isInitializing changed: ${isInitializing}`);
  }, [isInitializing]);

  useEffect(() => {
    traceAppRoot(`AppLoader showSplash changed: ${showSplash}`);
    if (!showSplash) {
      traceAppRoot('AppLoader showSplash state now reflects false');
    }
  }, [showSplash]);

  useEffect(() => {
    if (!isInitializing) {
      traceAppRoot('AppLoader detected isInitializing=false');
      // Show splash for minimum 1 second for better UX
      traceAppRoot('AppLoader splash hide timer started (1000ms)');
      const timer = setTimeout(() => {
        traceAppRoot('AppLoader 1000ms timer callback executing');
        traceAppRoot('AppLoader calling setShowSplash(false)');
        setShowSplash(false);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [isInitializing]);

  if (showSplash) {
    return <SplashScreen />;
  }

  return <>{children}</>;
};
