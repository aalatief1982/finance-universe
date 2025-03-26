
import React from 'react';
import WireframeButton from '../../WireframeButton';
import { Calendar, Camera } from 'lucide-react';

interface ProfileCreationScreenProps {
  onComplete: () => void;
}

const ProfileCreationScreen = ({ onComplete }: ProfileCreationScreenProps) => {
  return (
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
        <WireframeButton onClick={onComplete}>Create Profile</WireframeButton>
      </div>
    </div>
  );
};

export default ProfileCreationScreen;
