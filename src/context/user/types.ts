
import { AppError } from '@/types/error';

export type ThemeOption = 'light' | 'dark' | 'system';
export type CurrencyOption = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CAD' | 'AUD';

export interface UserPreferences {
  theme?: ThemeOption;
  currency?: CurrencyOption;
  notifications?: boolean;
  language?: string;
}

export interface User {
  id?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  completedOnboarding?: boolean;
  smsPermissionGranted?: boolean;
  smsProviders?: string[];
  preferences?: UserPreferences;
  createdAt?: Date;
  updatedAt?: Date;
  gender?: 'male' | 'female' | null;
  birthDate?: Date | null;
  occupation?: string;
}

export interface AuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  isVerifying: boolean;
  error: AppError | null;
}

export interface ProfileCompletionStatus {
  isComplete: boolean;
  missingFields: string[];
}

export interface UserContextValue {
  user: User | null;
  auth: AuthState;
  login: (phone: string) => Promise<boolean>;
  verify: (phone: string, code: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  checkProfileCompletion: () => ProfileCompletionStatus;
}
