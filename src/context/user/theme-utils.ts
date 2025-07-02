
/**
 * Detect system theme preference
 * @returns The detected system theme ('light' or 'dark')
 */
export const detectSystemTheme = (): 'light' | 'dark' => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light'; // Default fallback
};

/**
 * Apply theme to document
 * @param theme The theme to apply ('light' or 'dark')
 */
export const applyThemeToDocument = (theme: 'light' | 'dark'): void => {
  if (typeof document !== 'undefined') {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
};
