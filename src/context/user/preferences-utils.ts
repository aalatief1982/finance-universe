
import { User } from './types';
import { toast } from '@/hooks/use-toast';

/**
 * Update user preferences
 * @param user Current user
 * @param setUser Function to set user state
 * @param preferences Preferences to update
 */
export const updateUserPreferences = (
  user: User | null,
  setUser: (user: User | null) => void,
  preferences: Partial<User['preferences']>
): void => {
  if (!user) return;
  
  setUser({
    ...user,
    preferences: {
      ...user.preferences,
      ...preferences
    }
  });
  
  toast({
    title: "Settings updated",
    description: "Your preferences have been saved successfully."
  });
};

/**
 * Update display options
 * @param user Current user
 * @param setUser Function to set user state
 * @param displayOptions Display options to update
 */
export const updateDisplayOptions = (
  user: User | null,
  setUser: (user: User | null) => void,
  displayOptions: Partial<User['preferences']['displayOptions']>
): void => {
  if (!user || !user.preferences) return;
  
  setUser({
    ...user,
    preferences: {
      ...user.preferences,
      displayOptions: {
        ...user.preferences.displayOptions,
        ...displayOptions
      }
    }
  });
  
  toast({
    title: "Display settings updated",
    description: "Your display preferences have been saved."
  });
};

/**
 * Update privacy settings
 * @param user Current user
 * @param setUser Function to set user state
 * @param privacySettings Privacy settings to update
 */
export const updatePrivacySettings = (
  user: User | null,
  setUser: (user: User | null) => void,
  privacySettings: Partial<User['preferences']['privacy']>
): void => {
  if (!user || !user.preferences) return;
  
  setUser({
    ...user,
    preferences: {
      ...user.preferences,
      privacy: {
        ...user.preferences.privacy,
        ...privacySettings
      }
    }
  });
  
  toast({
    title: "Privacy settings updated",
    description: "Your privacy preferences have been saved."
  });
};

/**
 * Update data management settings
 * @param user Current user
 * @param setUser Function to set user state
 * @param dataManagement Data management settings to update
 */
export const updateDataManagement = (
  user: User | null,
  setUser: (user: User | null) => void,
  dataManagement: Partial<User['preferences']['dataManagement']>
): void => {
  if (!user || !user.preferences) return;
  
  setUser({
    ...user,
    preferences: {
      ...user.preferences,
      dataManagement: {
        ...user.preferences.dataManagement,
        ...dataManagement
      }
    }
  });
  
  toast({
    title: "Data management updated",
    description: "Your data management preferences have been saved."
  });
};
