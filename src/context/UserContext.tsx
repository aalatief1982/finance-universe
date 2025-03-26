
import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface UserProfile {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  smsProviders?: string[];
  isOnboarded?: boolean;
  createdAt?: string;
  preferences?: {
    currency?: string;
    theme?: 'light' | 'dark' | 'system';
    notifications?: boolean;
  };
}

interface UserContextType {
  user: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  setUser: (user: UserProfile | null) => void;
  updateUser: (data: Partial<UserProfile>) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const updateUser = (data: Partial<UserProfile>) => {
    setUser(prevUser => {
      if (!prevUser) return data as UserProfile;
      return { ...prevUser, ...data };
    });
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <UserContext.Provider value={{ 
      user, 
      isLoading, 
      error, 
      setUser, 
      updateUser, 
      logout 
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
