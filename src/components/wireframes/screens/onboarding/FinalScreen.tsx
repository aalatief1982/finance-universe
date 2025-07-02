
import React from 'react';
import WireframeButton from '../../WireframeButton';
import { motion } from 'framer-motion';
import { TrendingUp, Briefcase, Plane } from 'lucide-react';

interface FinalScreenProps {
  onNext: () => void;
  onBack?: () => void;
}

const FinalScreen = ({ onNext, onBack }: FinalScreenProps) => {
  return (
    <motion.div 
      className="text-center flex flex-col justify-between h-full py-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="space-y-4 max-w-md mx-auto">
        <h1 className="text-4xl font-bold text-primary leading-tight">
          EVERY EXPENSE HAS A STORY
        </h1>
        
        <p className="text-xl text-primary mt-6">
          We help you see where your money goes and why.
        </p>
      </div>
      
      <div className="flex justify-center my-8">
        <div className="relative">
          <div className="text-primary">
            <TrendingUp className="absolute -top-2 right-0 h-10 w-10" strokeWidth={1.5} />
            <Briefcase className="absolute bottom-0 right-8 h-12 w-12" strokeWidth={1.5} />
            <Plane className="absolute top-0 right-5 h-8 w-8 transform rotate-45" strokeWidth={1.5} />
            
            <svg viewBox="0 0 100 70" width="120" height="100" className="text-primary" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M10,50 Q30,10 50,30 T90,20" />
              <polygon points="10,60 20,45 30,50" />
              <polygon points="40,40 50,25 60,40" />
              <polygon points="70,30 80,15 90,30" />
            </svg>
          </div>
        </div>
      </div>
      
      <div className="flex justify-center items-center space-x-2">
        <div className="h-2 w-2 rounded-full bg-muted"></div>
        <div className="h-2 w-2 rounded-full bg-muted"></div>
        <div className="h-2 w-2 rounded-full bg-muted"></div>
        <div className="h-2 w-2 rounded-full bg-primary"></div>
      </div>
      
      <div className="pt-6">
        <WireframeButton 
          onClick={onNext} 
          variant="primary" 
          className="w-full"
        >
          Start Tracking
        </WireframeButton>
      </div>
    </motion.div>
  );
};

export default FinalScreen;
