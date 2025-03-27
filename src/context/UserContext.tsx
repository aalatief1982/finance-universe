import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { User as UserType, UserPreferences } from '@/types/user';

export interface User extends UserType {
  id: string;
  phone: string;
  phoneVerified: boolean;
  hasProfile: boolean;
  fullName: string;
  gender: 'male' | 'female' | null;
  birthDate: Date | null;
  email?: string;
  avatar?: string;
  occupation?: string;
  smsProviders: string[];
  completedOnboarding: boolean;
  createdAt?: Date;
  lastActive?: Date;
  preferences?: {
    currency: string;
    theme: 'light' | 'dark' | 'system';
    notifications: boolean;
    language: string;
  };
}

interface UserContextType {
  user: User | null;
  auth: {
    isAuthenticated: boolean;
    isLoading: boolean;
    isVerifying: boolean;
  };
  updateUser: (userData: Partial<User>) => void;
  startPhoneVerification: (phoneNumber: string) => Promise<boolean>;
  confirmPhoneVerification: (code: string) => Promise<boolean>;
  logIn: () => void;
  logOut: () => void;
  isLoading: boolean;
  loadUserProfile: () => Promise<User | null>;
  updateUserPreferences: (preferences: Partial<User['preferences']>) => void;
  completeOnboarding: () => void;
  isProfileComplete: () => boolean;
  updateAvatar: (avatarUrl: string) => void;
}

export const UserContext = createContext<UserContextType>({
  user: null,
  auth: {
    isAuthenticated: false,
    isLoading: false,
    isVerifying: false
  },
  updateUser: () => {},
  startPhoneVerification: async () => false,
  confirmPhoneVerification: async () => false,
  logIn: () => {},
  logOut: () => {},
  isLoading: false,
  loadUserProfile: async () => null,
  updateUserPreferences: () => {},
  completeOnboarding: () => {},
  isProfileComplete: () => false,
  updateAvatar: () => {}
});

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [auth, setAuth] = useState({
    isAuthenticated: false,
    isLoading: true,
    isVerifying: false
  });
  
  // Load user from local storage on initial render
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        
        // Convert string dates back to Date objects
        if (parsedUser.birthDate) {
          parsedUser.birthDate = new Date(parsedUser.birthDate);
        }
        if (parsedUser.createdAt) {
          parsedUser.createdAt = new Date(parsedUser.createdAt);
        }
        if (parsedUser.lastActive) {
          parsedUser.lastActive = new Date(parsedUser.lastActive);
        }
        
        setUser(parsedUser);
        setAuth(prev => ({
          ...prev,
          isAuthenticated: parsedUser.completedOnboarding || false,
          isLoading: false
        }));
      } catch (error) {
        console.error('Failed to parse stored user data', error);
        setAuth(prev => ({ ...prev, isLoading: false }));
      }
    } else {
      setAuth(prev => ({ ...prev, isLoading: false }));
    }
  }, []);
  
  // Save user to local storage whenever it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    }
  }, [user]);
  
  const updateUser = useCallback((userData: Partial<User>) => {
    setUser(prevUser => {
      if (!prevUser) {
        const newUser: User = {
          id: userData.id || `user_${Date.now()}`,
          phone: userData.phone || '',
          phoneVerified: userData.phoneVerified || false,
          hasProfile: userData.hasProfile || false,
          fullName: userData.fullName || '',
          gender: userData.gender || null,
          birthDate: userData.birthDate || null,
          email: userData.email,
          avatar: userData.avatar,
          occupation: userData.occupation,
          smsProviders: userData.smsProviders || [],
          completedOnboarding: userData.completedOnboarding || false,
          createdAt: new Date(),
          lastActive: new Date(),
          preferences: userData.preferences || {
            currency: 'USD',
            theme: 'light',
            notifications: true,
            language: 'en'
          }
        };
        return newUser;
      }
      
      // Update lastActive timestamp
      const updatedUser = { 
        ...prevUser, 
        ...userData,
        lastActive: new Date() 
      };
      
      return updatedUser;
    });
  }, []);
  
  const startPhoneVerification = async (phoneNumber: string): Promise<boolean> => {
    setIsLoading(true);
    setAuth(prev => ({ ...prev, isVerifying: true }));
    
    try {
      // In a real app, this would call Firebase Auth or similar service
      // For now, we'll simulate a successful verification after a short delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update user phone number
      updateUser({ phone: phoneNumber });
      
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Error starting phone verification', error);
      setIsLoading(false);
      return false;
    }
  };
  
  const confirmPhoneVerification = async (code: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // In a real app, this would verify the code with Firebase Auth or similar
      // For now, we'll simulate a successful verification if the code is "1234"
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const isValid = code === "1234"; // For demo purposes, "1234" is always valid
      
      if (isValid) {
        updateUser({ phoneVerified: true });
        setAuth(prev => ({ ...prev, isVerifying: false }));
      }
      
      setIsLoading(false);
      return isValid;
    } catch (error) {
      console.error('Error confirming verification code', error);
      setIsLoading(false);
      return false;
    }
  };
  
  const loadUserProfile = useCallback(async (): Promise<User | null> => {
    // In a real app, this would fetch user data from the backend
    // For now, we'll just return the current user from state
    
    // Simulate API call
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    setIsLoading(false);
    
    return user;
  }, [user]);
  
  const updateUserPreferences = useCallback((preferences: Partial<User['preferences']>) => {
    setUser(prevUser => {
      if (!prevUser) return null;
      
      return {
        ...prevUser,
        preferences: {
          ...prevUser.preferences,
          ...preferences
        }
      };
    });
  }, []);
  
  const completeOnboarding = useCallback(() => {
    updateUser({ 
      completedOnboarding: true,
      hasProfile: true 
    });
    logIn();
  }, []);
  
  const isProfileComplete = useCallback((): boolean => {
    if (!user) return false;
    
    // Check if required profile fields are completed
    const requiredFields = [
      user.fullName,
      user.phoneVerified,
      user.phone,
      user.smsProviders && user.smsProviders.length > 0
    ];
    
    return requiredFields.every(Boolean);
  }, [user]);
  
  const updateAvatar = useCallback((avatarUrl: string) => {
    updateUser({ avatar: avatarUrl });
  }, []);
  
  const logIn = useCallback(() => {
    setAuth(prev => ({ ...prev, isAuthenticated: true }));
    
    // Update last active timestamp
    updateUser({ lastActive: new Date() });
  }, []);
  
  const logOut = useCallback(() => {
    setAuth(prev => ({ ...prev, isAuthenticated: false }));
    setUser(null);
    localStorage.removeItem('user');
  }, []);
  
  return (
    <UserContext.Provider
      value={{
        user,
        auth,
        updateUser,
        startPhoneVerification,
        confirmPhoneVerification,
        logIn,
        logOut,
        isLoading,
        loadUserProfile,
        updateUserPreferences,
        completeOnboarding,
        isProfileComplete,
        updateAvatar
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
