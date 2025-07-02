
import React from 'react';
import WireframeButton from '../../WireframeButton';
import { motion } from 'framer-motion';

interface WelcomeScreenProps {
  onNext: () => void;
}

const WelcomeScreen = ({ onNext }: WelcomeScreenProps) => {
  return (
    <motion.div 
      className="text-center flex flex-col justify-center items-center h-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="space-y-6 max-w-md">
        <h1 className="text-5xl font-bold text-primary">LET'S BEGIN</h1>
        
        <div className="py-10">
          <WireframeButton 
            onClick={onNext} 
            variant="primary" 
            className="text-xl py-4 px-8 rounded-full w-64"
          >
            Start My Story
          </WireframeButton>
        </div>
      </div>
    </motion.div>
  );
};

export default WelcomeScreen;
