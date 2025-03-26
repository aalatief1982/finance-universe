
import React from 'react';
import WireframeButton from '../../WireframeButton';

interface UserData {
  name?: string;
  email?: string;
  phone?: string;
}

interface ProfileCreationScreenProps {
  onComplete: () => void;
  userData: UserData;
  onUpdateUserData: (data: Partial<UserData>) => void;
  errors: {[key: string]: string};
}

const ProfileCreationScreen = ({ 
  onComplete, 
  userData, 
  onUpdateUserData,
  errors 
}: ProfileCreationScreenProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    onUpdateUserData({ [name]: value });
  };

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <label className="block text-gray-700 mb-2">Full Name</label>
        <input 
          name="name"
          type="text" 
          placeholder="Enter your full name" 
          className={`w-full p-2 border rounded-lg ${errors.name ? 'border-red-500' : ''}`}
          value={userData.name || ''}
          onChange={handleChange}
        />
        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
      </div>
      
      <div className="mb-4">
        <label className="block text-gray-700 mb-2">Email Address</label>
        <input 
          name="email"
          type="email" 
          placeholder="you@example.com" 
          className={`w-full p-2 border rounded-lg ${errors.email ? 'border-red-500' : ''}`}
          value={userData.email || ''}
          onChange={handleChange}
        />
        {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
      </div>
      
      <div className="mt-2">
        <WireframeButton onClick={onComplete}>Create Account</WireframeButton>
      </div>
    </div>
  );
};

export default ProfileCreationScreen;
