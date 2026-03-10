/**
 * @file AppLoader.tsx
 * @description Startup splash gate. Shows SplashScreen until:
 *   1. isInitializing is false (storage/migrations done)
 *   2. Both route-ready AND content-ready signals have fired (from startup-ready module)
 *   3. OR a hard 2.5s max timeout expires as safety fallback
 */
import React, { useState, useEffect } from 'react';
import { SplashScreen } from './SplashScreen';
import { onStartupReady } from '@/lib/startup-ready';

const TRACE_PREFIX = '[TRACE][APP_ROOT]';
let traceCounter = 0;
const traceAppRoot = (message: string, ...args: unknown[]) => {
  traceCounter += 1;
  const now = performance.now().toFixed(2);
  console.log(`${TRACE_PREFIX}[${traceCounter}][${now}ms] ${message}`, ...args);
};

const MAX_SPLASH_WAIT_MS = 2500;

interface AppLoaderProps {
  children: React.ReactNode;
  isInitializing: boolean;
}

export const AppLoader: React.FC<AppLoaderProps> = ({ children, isInitializing }) => {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    traceAppRoot('AppLoader mounted');
    return () => {
      traceAppRoot('AppLoader unmounted');
    };
  }, []);

  useEffect(() => {
    traceAppRoot(`AppLoader isInitializing changed: ${isInitializing}`);
  }, [isInitializing]);

  useEffect(() => {
    traceAppRoot(`AppLoader showSplash changed: ${showSplash}`);
  }, [showSplash]);

  useEffect(() => {
    if (!isInitializing) {
      traceAppRoot('AppLoader detected isInitializing=false, waiting for startup-ready signals');
      let cancelled = false;

      // Wait for both route + content readiness
      onStartupReady(() => {
        if (!cancelled) {
          traceAppRoot('AppLoader startup-ready signals received, hiding splash');
          if (DEBUG_STARTUP) window.alert(`[XPENSIA DEBUG #6] React Splash Hide (ready signals)\nTime: ${performance.now().toFixed(2)}ms`); // TEMP-DEBUG-REMOVE
          setShowSplash(false);
        }
      });

      // Hard max timeout to prevent stuck splash
      const timeout = setTimeout(() => {
        if (!cancelled && showSplash) {
          traceAppRoot(`AppLoader max timeout (${MAX_SPLASH_WAIT_MS}ms) reached, force hiding splash`);
          if (DEBUG_STARTUP) window.alert(`[XPENSIA DEBUG #6b] React Splash Hide (timeout fallback)\nTime: ${performance.now().toFixed(2)}ms`); // TEMP-DEBUG-REMOVE
          setShowSplash(false);
        }
      }, MAX_SPLASH_WAIT_MS);

      return () => {
        cancelled = true;
        clearTimeout(timeout);
      };
    }
  }, [isInitializing]);

  return (
    <>
      {children}
      {showSplash && <SplashScreen />}
    </>
  );
};
