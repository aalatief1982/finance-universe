
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
    
    onUpdateUserData({ _errors: newErrors });
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onComplete();
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit}>
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
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Phone Number</label>
          <input 
            name="phone"
            type="tel" 
            placeholder="+1 (000) 000-0000" 
            className={`w-full p-2 border rounded-lg ${errors.phone ? 'border-red-500' : ''}`}
            value={userData.phone || ''}
            onChange={handleChange}
          />
          {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
        </div>
        
        <div className="mt-2">
          <WireframeButton type="submit">Create Account</WireframeButton>
        </div>
      </form>
    </div>
  );
};

export default ProfileCreationScreen;
