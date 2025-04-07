
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
