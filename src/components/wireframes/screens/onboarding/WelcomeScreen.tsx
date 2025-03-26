
import React from 'react';
import WireframeButton from '../../WireframeButton';
import { motion } from 'framer-motion';
import { SmartphoneIcon, ShieldCheckIcon, BarChartIcon } from 'lucide-react';

interface WelcomeScreenProps {
  onNext: () => void;
}

const WelcomeScreen = ({ onNext }: WelcomeScreenProps) => {
  return (
    <motion.div 
      className="text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="rounded-full h-48 w-48 bg-primary/10 flex items-center justify-center mx-auto mb-8 overflow-hidden">
        <img 
          src="/placeholder.svg" 
          alt="App Logo" 
          className="w-32 h-32" 
        />
      </div>
      <h2 className="text-2xl font-bold mb-4">Expense Tracker</h2>
      <p className="text-gray-600 mb-8 max-w-md mx-auto">
        Track your expenses effortlessly by linking your SMS notifications.
        Get insights into your spending habits and take control of your finances.
      </p>
      <div className="space-y-4">
        <WireframeButton onClick={onNext} variant="primary" className="w-full">
          Get Started
        </WireframeButton>
        
        <div className="mt-8 flex flex-col gap-3">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <SmartphoneIcon size={16} className="text-primary" />
            <span>SMS verification for secure login</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <ShieldCheckIcon size={16} className="text-primary" />
            <span>Your data is secure and never leaves your device</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <BarChartIcon size={16} className="text-primary" />
            <span>Customizable dashboards for financial insights</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default WelcomeScreen;
