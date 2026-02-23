
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
      console.log('[TRACE][theme-utils] before classList.add("dark")', {
        className: document.documentElement.className,
      });
      document.documentElement.classList.add('dark');
      console.log('[TRACE][theme-utils] after classList.add("dark")', {
        className: document.documentElement.className,
      });
    } else {
      console.log('[TRACE][theme-utils] before classList.remove("dark")', {
        className: document.documentElement.className,
      });
      document.documentElement.classList.remove('dark');
      console.log('[TRACE][theme-utils] after classList.remove("dark")', {
        className: document.documentElement.className,
      });
    }
  }
};
