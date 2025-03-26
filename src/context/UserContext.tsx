
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export interface UserProfile {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  gender?: 'male' | 'female';
  birthDate?: Date;
  profileImage?: string;
  smsProviders?: string[];
  isOnboarded?: boolean;
  createdAt?: string;
  preferences?: {
    currency?: string;
    theme?: 'light' | 'dark' | 'system';
    notifications?: boolean;
  };
}

interface AuthState {
  isAuthenticated: boolean;
  isVerifying: boolean;
  verificationId?: string;
}

interface UserContextType {
  user: UserProfile | null;
  auth: AuthState;
  isLoading: boolean;
  error: string | null;
  setUser: (user: UserProfile | null) => void;
  updateUser: (data: Partial<UserProfile>) => void;
  logout: () => void;
  startPhoneVerification: (phoneNumber: string) => Promise<boolean>;
  confirmPhoneVerification: (code: string) => Promise<boolean>;
  setAuthState: (auth: Partial<AuthState>) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [auth, setAuth] = useState<AuthState>({
    isAuthenticated: false,
    isVerifying: false,
  });

  // Check for existing user in localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        
        // Convert date strings back to Date objects
        if (parsedUser.birthDate) {
          parsedUser.birthDate = new Date(parsedUser.birthDate);
        }
        
        setUser(parsedUser);
        setAuth(prev => ({ ...prev, isAuthenticated: true }));
      } catch (err) {
        console.error('Failed to parse stored user data', err);
      }
    }
  }, []);

  // Save user data to localStorage when it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    }
  }, [user]);

  const updateUser = (data: Partial<UserProfile>) => {
    setUser(prevUser => {
      if (!prevUser) return data as UserProfile;
      return { ...prevUser, ...data };
    });
  };

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
    setAuth({ isAuthenticated: false, isVerifying: false });
  };

  // Mock phone verification in a real app this would use Firebase
  const startPhoneVerification = async (phoneNumber: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In a real app, this would store a verification ID from Firebase
      setAuth(prev => ({ 
        ...prev, 
        isVerifying: true,
        verificationId: 'mock-verification-id'
      }));
      
      // Update user's phone number
      updateUser({ phone: phoneNumber });
      
      setIsLoading(false);
      return true;
    } catch (err) {
      setError('Failed to send verification code. Please try again.');
      setIsLoading(false);
      return false;
    }
  };

  // Mock confirmation in a real app this would verify with Firebase
  const confirmPhoneVerification = async (code: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In a real app, this would confirm the code with Firebase
      // For demo, we'll accept any code
      
      setAuth(prev => ({ 
        ...prev, 
        isAuthenticated: true,
        isVerifying: false 
      }));
      
      setIsLoading(false);
      return true;
    } catch (err) {
      setError('Invalid verification code. Please try again.');
      setIsLoading(false);
      return false;
    }
  };

  const setAuthState = (newState: Partial<AuthState>) => {
    setAuth(prev => ({ ...prev, ...newState }));
  };

  return (
    <UserContext.Provider value={{ 
      user, 
      auth,
      isLoading, 
      error, 
      setUser, 
      updateUser, 
      logout,
      startPhoneVerification,
      confirmPhoneVerification,
      setAuthState
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
