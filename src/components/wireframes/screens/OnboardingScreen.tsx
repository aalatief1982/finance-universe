
import React, { useState } from 'react';
import WireframeContainer from '../WireframeContainer';
import WireframeHeader from '../WireframeHeader';
import WireframeButton from '../WireframeButton';
import { Calendar, Camera } from 'lucide-react';

interface OnboardingScreenProps {
  onNext: () => void;
}

const OnboardingScreen = ({ onNext }: OnboardingScreenProps) => {
  const [step, setStep] = useState(0);

  const screens = [
    {
      title: "Welcome",
      content: (
        <div className="text-center">
          <div className="bg-blue-100 h-48 flex items-center justify-center mb-4">
            <img src="/api/placeholder/200/200" alt="App Logo" className="w-48 h-48" />
          </div>
          <h2 className="text-xl font-bold mb-4">Expense Tracker</h2>
          <p className="text-gray-600 mb-4">Track your expenses effortlessly</p>
          <WireframeButton onClick={() => setStep(1)}>Get Started</WireframeButton>
        </div>
      )
    },
    {
      title: "Phone Verification",
      content: (
        <div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Enter Mobile Number</label>
            <input 
              type="tel" 
              placeholder="+1 (000) 000-0000" 
              className="w-full p-2 border rounded-lg"
            />
          </div>
          <WireframeButton onClick={() => setStep(2)}>Send Verification Code</WireframeButton>
        </div>
      )
    },
    {
      title: "Profile Creation",
      content: (
        <div>
          <div className="flex justify-center mb-4">
            <div className="bg-gray-200 w-32 h-32 rounded-full flex items-center justify-center">
              <Camera className="text-gray-500" size={48} />
            </div>
          </div>
          <div className="space-y-3">
            <input 
              type="text" 
              placeholder="Full Name" 
              className="w-full p-2 border rounded-lg"
            />
            <div className="flex space-x-2">
              <button className="flex-1 py-2 border rounded-lg">Male</button>
              <button className="flex-1 py-2 border rounded-lg">Female</button>
            </div>
            <div className="flex items-center border rounded-lg p-2">
              <Calendar className="mr-2 text-gray-500" size={24} />
              <span>Select Birth Date</span>
            </div>
            <input 
              type="email" 
              placeholder="Email (Optional)" 
              className="w-full p-2 border rounded-lg"
            />
            <WireframeButton onClick={onNext}>Create Profile</WireframeButton>
          </div>
        </div>
      )
    }
  ];

  return (
    <WireframeContainer>
      <WireframeHeader title={screens[step].title} />
      {screens[step].content}
    </WireframeContainer>
  );
};

export default OnboardingScreen;
