import React, { createContext, useState, useEffect, useContext } from 'react';

interface User {
  id: string;
  phone: string;
  phoneVerified: boolean;
  hasProfile: boolean;
  fullName: string;
  gender: 'male' | 'female' | null;
  birthDate: Date | null;
  email?: string;
  smsProviders: string[];
  completedOnboarding: boolean;
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
  isLoading: false
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
  
  const updateUser = (userData: Partial<User>) => {
    setUser(prevUser => {
      if (!prevUser) return userData as User;
      return { ...prevUser, ...userData };
    });
  };
  
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
  
  const logIn = () => {
    setAuth(prev => ({ ...prev, isAuthenticated: true }));
  };
  
  const logOut = () => {
    setAuth(prev => ({ ...prev, isAuthenticated: false }));
    setUser(null);
    localStorage.removeItem('user');
  };
  
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
        isLoading
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
