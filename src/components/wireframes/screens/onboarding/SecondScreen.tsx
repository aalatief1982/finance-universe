
import React from 'react';
import WireframeButton from '../../WireframeButton';
import { motion } from 'framer-motion';
import { BarChart3 } from 'lucide-react';

interface SecondScreenProps {
  onNext: () => void;
  onBack?: () => void;
}

const SecondScreen = ({ onNext, onBack }: SecondScreenProps) => {
  return (
    <motion.div 
      className="text-center flex flex-col justify-between h-full py-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="space-y-4 max-w-md mx-auto">
        <h1 className="text-4xl font-bold text-primary leading-tight">
          WRITE YOUR NEXT CHAPTER WITH CONFIDENCE
        </h1>
        
        <p className="text-xl text-primary mt-6">
          Stay ahead with smart budgets, alerts, and insights.
        </p>
      </div>
      
      <div className="flex justify-center my-8">
        <BarChart3 className="text-primary h-32 w-32" strokeWidth={1} />
      </div>
      
      <div className="flex justify-center items-center space-x-2">
        <div className="h-2 w-2 rounded-full bg-muted"></div>
        <div className="h-2 w-2 rounded-full bg-primary"></div>
        <div className="h-2 w-2 rounded-full bg-muted"></div>
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

export default SecondScreen;
