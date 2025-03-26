
import React, { useState } from 'react';
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
  const [localErrors, setLocalErrors] = useState<{[key: string]: string}>({});
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    onUpdateUserData({ [name]: value });
  };

  const validateForm = (): boolean => {
    let isValid = true;
    const newErrors: {[key: string]: string} = {};
    
    if (!userData.name || userData.name.trim() === '') {
      newErrors.name = 'Name is required';
      isValid = false;
    }
    
    if (!userData.email || userData.email.trim() === '') {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(userData.email)) {
      newErrors.email = 'Please enter a valid email address';
      isValid = false;
    }
    
    if (!userData.phone || userData.phone.trim() === '') {
      newErrors.phone = 'Phone number is required';
      isValid = false;
    }
    
    setLocalErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onComplete();
    }
  };

  // Use combined errors from props and local state
  const displayErrors = { ...errors, ...localErrors };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Full Name</label>
          <input 
            name="name"
            type="text" 
            placeholder="Enter your full name" 
            className={`w-full p-2 border rounded-lg ${displayErrors.name ? 'border-red-500' : ''}`}
            value={userData.name || ''}
            onChange={handleChange}
          />
          {displayErrors.name && <p className="text-red-500 text-sm mt-1">{displayErrors.name}</p>}
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Email Address</label>
          <input 
            name="email"
            type="email" 
            placeholder="you@example.com" 
            className={`w-full p-2 border rounded-lg ${displayErrors.email ? 'border-red-500' : ''}`}
            value={userData.email || ''}
            onChange={handleChange}
          />
          {displayErrors.email && <p className="text-red-500 text-sm mt-1">{displayErrors.email}</p>}
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Phone Number</label>
          <input 
            name="phone"
            type="tel" 
            placeholder="+1 (000) 000-0000" 
            className={`w-full p-2 border rounded-lg ${displayErrors.phone ? 'border-red-500' : ''}`}
            value={userData.phone || ''}
            onChange={handleChange}
          />
          {displayErrors.phone && <p className="text-red-500 text-sm mt-1">{displayErrors.phone}</p>}
        </div>
        
        <div className="mt-2">
          <button type="submit" className="w-full py-2 px-4 rounded-lg text-center font-semibold transition-colors bg-blue-600 text-white hover:bg-blue-700">
            Create Account
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileCreationScreen;
