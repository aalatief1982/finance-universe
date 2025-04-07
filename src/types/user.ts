
// Define user types
export interface User {
  id?: string; // Make id optional to be compatible with both contexts
  email?: string;
  phone?: string;
  fullName?: string;
  avatarUrl?: string;
  createdAt?: string;
  lastActive?: string;
  smsPermissionGranted?: boolean;
  smsProviders?: string[];
  completedOnboarding?: boolean;
  settings?: UserSettings;
}

export interface UserSettings {
  currency: string;
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
  language: string;
  categories?: CategorySettings;
}

export interface CategorySettings {
  customCategories: boolean;
  hiddenCategories: string[];
}

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Add ProfileData interface for user profile creation
export interface ProfileData {
  image?: string;
  fullName: string;
  gender: 'male' | 'female' | null;
  birthDate: Date | null;
  email?: string;
  occupation?: string;
  createdAt?: Date;
}

// Add UserPreferences interface for locale settings
export interface UserPreferences {
  theme?: 'light' | 'dark' | 'system';
  currency?: 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CAD' | 'AUD';
  notifications?: boolean;
  language?: string;
  displayOptions?: {
    showCents?: boolean;
    weekStartsOn?: 'sunday' | 'monday';
    defaultView?: 'list' | 'stats' | 'calendar';
    compactMode?: boolean;
  };
  privacy?: {
    maskAmounts?: boolean;
    requireAuthForSensitiveActions?: boolean;
  };
}
