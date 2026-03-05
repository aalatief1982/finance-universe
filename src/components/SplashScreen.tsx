/**
 * @file SplashScreen.tsx
 * @description UI component for SplashScreen.
 *
 * @module components/SplashScreen
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
import React from 'react';
import { XpensiaLogo } from './header/XpensiaLogo';

export const SplashScreen: React.FC = () => {
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
        
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  );
};