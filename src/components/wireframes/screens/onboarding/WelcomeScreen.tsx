
import React from 'react';
import WireframeButton from '../../WireframeButton';

interface WelcomeScreenProps {
  onNext: () => void;
}

const WelcomeScreen = ({ onNext }: WelcomeScreenProps) => {
  return (
    <div className="text-center">
      <div className="bg-blue-100 h-48 flex items-center justify-center mb-4">
        <img src="/api/placeholder/200/200" alt="App Logo" className="w-48 h-48" />
      </div>
      <h2 className="text-xl font-bold mb-4">Expense Tracker</h2>
      <p className="text-gray-600 mb-4">Track your expenses effortlessly</p>
      <WireframeButton onClick={onNext}>Get Started</WireframeButton>
    </div>
  );
};

export default WelcomeScreen;
