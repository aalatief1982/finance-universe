import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XpensiaLogo } from '@/components/header/XpensiaLogo';

interface SplashScreenProps {
  onComplete: () => void;
  duration?: number;
}

const BrandSplashScreen: React.FC<SplashScreenProps> = ({ 
  onComplete, 
  duration = 2000 
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 300); // Wait for exit animation
    }, duration);

    return () => clearTimeout(timer);
  }, [onComplete, duration]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 bg-gradient-to-br from-primary to-secondary flex items-center justify-center"
        >
          <div className="text-center space-y-8">
            {/* Animated Logo */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ 
                duration: 0.6,
                ease: [0.4, 0.0, 0.2, 1],
                delay: 0.2
              }}
              className="flex justify-center"
            >
              <div className="relative">
                <XpensiaLogo className="h-20 w-20" />
                
                {/* Pulse effect */}
                <motion.div
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 0, 0.5]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute inset-0 h-20 w-20 bg-white/20 rounded-lg"
                />
              </div>
            </motion.div>

            {/* Brand Name */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ 
                duration: 0.6,
                delay: 0.4,
                ease: [0.4, 0.0, 0.2, 1]
              }}
              className="space-y-2"
            >
              <h1 className="text-4xl font-bold text-white tracking-tight">
                Xpensia
              </h1>
              <p className="text-lg text-white/80">
                Smart Expense Tracking
              </p>
            </motion.div>

            {/* Loading indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="flex justify-center"
            >
              <div className="flex space-x-2">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.5, 1, 0.5]
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      delay: i * 0.2,
                      ease: "easeInOut"
                    }}
                    className="w-2 h-2 bg-white/60 rounded-full"
                  />
                ))}
              </div>
            </motion.div>

            {/* Version info */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="text-sm text-white/60 absolute bottom-8 left-1/2 transform -translate-x-1/2"
            >
              v2.0.0
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BrandSplashScreen;