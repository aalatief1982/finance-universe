
export interface User {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
  phoneVerified?: boolean;
  gender?: 'male' | 'female' | null;
  birthDate?: Date | null;
  avatar?: string;
  occupation?: string;
  hasProfile?: boolean;
  smsProviders?: string[];
  completedOnboarding?: boolean;
  createdAt?: Date;
  lastActive?: Date;
  settings?: {
    currency?: string;
    language?: string;
    theme?: 'light' | 'dark' | 'system';
    notifications?: boolean;
  };
}

export interface UserPreferences {
  currency: string;
  language: string;
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
}

export type ProfileSection = 'personal' | 'preferences' | 'security' | 'notifications';

export interface ProfileMenuItem {
  title: string;
  description: string;
  icon: React.ComponentType;
  link: string;
  status?: string;
  statusColor?: string;
  section: ProfileSection;
}
