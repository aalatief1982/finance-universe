import React, { useState, useEffect } from 'react';
import { SplashScreen } from './SplashScreen';

interface AppLoaderProps {
  children: React.ReactNode;
  isInitializing: boolean;
}

export const AppLoader: React.FC<AppLoaderProps> = ({ children, isInitializing }) => {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    if (!isInitializing) {
      // Show splash for minimum 1 second for better UX
      const timer = setTimeout(() => {
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