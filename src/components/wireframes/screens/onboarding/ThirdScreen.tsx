
import React from 'react';
import WireframeButton from '../../WireframeButton';
import { motion } from 'framer-motion';
import { Wallet } from 'lucide-react';

interface ThirdScreenProps {
  onNext: () => void;
  onBack?: () => void;
}

const ThirdScreen = ({ onNext, onBack }: ThirdScreenProps) => {
  return (
    <motion.div 
      className="text-center flex flex-col justify-between h-full py-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="space-y-4 max-w-md mx-auto">
        <h1 className="text-4xl font-bold text-primary leading-tight">
          STORIES ARE BETTER WHEN ORGANIZED
        </h1>
        
        <p className="text-xl text-primary mt-6">
          Auto-categorized, labeled, and summarized just for you.
        </p>
      </div>
      
      <div className="flex justify-center my-8">
        <div className="relative">
          <Wallet className="text-primary h-36 w-36" strokeWidth={1} />
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-xs font-bold text-primary">
            GROCERIES
          </div>
          <div className="absolute top-12 left-1/2 transform -translate-x-1/2 text-xl font-bold text-primary">
            CAR
          </div>
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 text-lg font-bold text-primary">
            BILLS
          </div>
        </div>
      </div>
      
      <p className="text-2xl font-semibold text-primary">
        Track your Finance Story
      </p>
      
      <div className="flex justify-center items-center space-x-2">
        <div className="h-2 w-2 rounded-full bg-muted"></div>
        <div className="h-2 w-2 rounded-full bg-muted"></div>
        <div className="h-2 w-2 rounded-full bg-primary"></div>
        <div className="h-2 w-2 rounded-full bg-muted"></div>
      </div>
      
      <div className="pt-6">
        <WireframeButton 
          onClick={onNext} 
          variant="primary" 
          className="w-full"
        >
          Continue
        </WireframeButton>
      </div>
    </motion.div>
  );
};

export default ThirdScreen;
