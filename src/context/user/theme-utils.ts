
import { ThemeOption } from './types';

/**
 * Sets the theme based on the user preference
 * @param theme The theme to set: 'light', 'dark', or 'system'
 */
export const setTheme = (theme: ThemeOption): void => {
  try {
    // Remove all theme classes first
    document.documentElement.classList.remove('light', 'dark');
    
    if (theme === 'system') {
      // Apply theme based on system preference
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.add(systemPrefersDark ? 'dark' : 'light');
      
      // Store the effective theme (actual applied theme)
      localStorage.setItem('effective-theme', systemPrefersDark ? 'dark' : 'light');
    } else {
      // Apply the specified theme directly
      document.documentElement.classList.add(theme);
      
      // Store the effective theme
      localStorage.setItem('effective-theme', theme);
    }
    
    // Store the user preference
    localStorage.setItem('theme', theme);
    
    // Notify any listeners that theme changed
    window.dispatchEvent(new CustomEvent('theme-changed', { detail: { theme } }));
  } catch (error) {
    console.error('Failed to set theme:', error);
  }
};

/**
 * Gets the currently active theme
 * @returns The active theme: 'light' or 'dark'
 */
export const getActiveTheme = (): 'light' | 'dark' => {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
};

/**
 * Gets the user's theme preference
 * @returns The theme preference: 'light', 'dark', or 'system'
 */
export const getUserThemePreference = (): ThemeOption => {
  const storedTheme = localStorage.getItem('theme') as ThemeOption;
  return storedTheme || 'system';
};

/**
 * Gets the effective theme (actual applied theme, not preference)
 * @returns The effective theme: 'light' or 'dark'
 */
export const getEffectiveTheme = (): 'light' | 'dark' => {
  return localStorage.getItem('effective-theme') as 'light' | 'dark' || getActiveTheme();
};

/**
 * Initializes theme based on stored preference or system setting
 */
export const initializeTheme = (): void => {
  const storedTheme = getUserThemePreference();
  setTheme(storedTheme);
  
  // Set up system theme change listener if using system preference
  if (storedTheme === 'system') {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => setTheme('system');
    mediaQuery.addEventListener('change', handleChange);
    
    // Clean up function for when component unmounts
    return () => mediaQuery.removeEventListener('change', handleChange);
  }
};
