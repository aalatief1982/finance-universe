/**
 * @file SplashScreen.tsx
 * @description React splash screen. On mount, hides the HTML bootstrap loader
 *   to create a single seamless handoff from HTML → React splash.
 */
import React, { useEffect } from 'react';
import { XpensiaLogo } from './header/XpensiaLogo';

type XpensiaWindow = Window & {
  __xpensiaHideInitialLoading?: () => void;
};

export const SplashScreen: React.FC = () => {
  useEffect(() => {
    // Hide the HTML bootstrap loader now that React splash is painted
    (window as XpensiaWindow).__xpensiaHideInitialLoading?.();
  }, []);

  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
      <div className="flex flex-col items-center space-y-6">
        <div className="animate-scale-in">
          <XpensiaLogo className="h-24 w-24" />
        </div>
        
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Xpensia</h1>
          <p className="text-muted-foreground">Track Your Finance Story</p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  );
};
