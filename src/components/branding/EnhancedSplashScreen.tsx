import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import XpensiaLogo from './XpensiaLogo';
import { Progress } from '@/components/ui/progress';
import { BRAND_GUIDELINES } from '@/constants/brandGuidelines';

interface EnhancedSplashScreenProps {
  onComplete?: () => void;
  duration?: number;
  showProgress?: boolean;
  className?: string;
}

const EnhancedSplashScreen: React.FC<EnhancedSplashScreenProps> = ({
  onComplete,
  duration = 3000,
  showProgress = true,
  className
}) => {
  const [progress, setProgress] = useState(0);
  const [loadingStage, setLoadingStage] = useState<'init' | 'loading' | 'complete'>('init');

  useEffect(() => {
    const stages = [
      { stage: 'init', delay: 500, message: 'Initializing...' },
      { stage: 'loading', delay: 1500, message: 'Loading your data...' },
      { stage: 'complete', delay: 1000, message: 'Ready!' }
    ];

    let currentProgress = 0;
    const progressInterval = setInterval(() => {
      currentProgress += Math.random() * 15;
      if (currentProgress > 100) currentProgress = 100;
      setProgress(currentProgress);
    }, 100);

    const stageTimeouts = stages.map((stageInfo, index) => {
      return setTimeout(() => {
        setLoadingStage(stageInfo.stage as any);
        if (stageInfo.stage === 'complete') {
          setProgress(100);
          clearInterval(progressInterval);
          setTimeout(() => {
            onComplete?.();
          }, 500);
        }
      }, stages.slice(0, index).reduce((total, s) => total + s.delay, 0));
    });

    return () => {
      clearInterval(progressInterval);
      stageTimeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [onComplete]);

  const getLoadingMessage = () => {
    switch (loadingStage) {
      case 'init':
        return 'Welcome to Xpensia';
      case 'loading':
        return 'Preparing your financial dashboard...';
      case 'complete':
        return 'Ready to go!';
      default:
        return 'Loading...';
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={cn(
          "fixed inset-0 z-50 bg-background flex items-center justify-center",
          "bg-gradient-to-br from-primary/5 via-background to-secondary/5",
          className
        )}
      >
        <div className="text-center max-w-sm w-full px-6">
          {/* Logo Animation */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 20,
              delay: 0.2
            }}
            className="mb-8"
          >
            <XpensiaLogo size="lg" clickable={false} className="justify-center" />
          </motion.div>

          {/* Tagline */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mb-8"
          >
            <p className="text-muted-foreground text-sm">
              {BRAND_GUIDELINES.tagline}
            </p>
          </motion.div>

          {/* Progress Section */}
          {showProgress && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="space-y-4"
            >
              <Progress 
                value={progress} 
                className="h-2"
                indicatorClassName="bg-gradient-primary transition-all duration-500"
              />
              
              <motion.p
                key={loadingStage}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-sm text-muted-foreground"
              >
                {getLoadingMessage()}
              </motion.p>
            </motion.div>
          )}

          {/* Loading Dots Animation */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.8 }}
            className="flex justify-center mt-8"
          >
            {[0, 1, 2].map((index) => (
              <motion.div
                key={index}
                className="w-2 h-2 bg-primary rounded-full mx-1"
                animate={{ y: [0, -8, 0] }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  delay: index * 0.1
                }}
              />
            ))}
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EnhancedSplashScreen;