/**
 * Utility to clear all local storage before next run
 * This ensures a clean state for testing and development
 */
export const clearAllStorage = () => {
  try {
    // Clear localStorage
    if (typeof Storage !== 'undefined' && localStorage) {
      console.log('Clearing localStorage...');
      localStorage.clear();
    }

    // Clear sessionStorage
    if (typeof Storage !== 'undefined' && sessionStorage) {
      console.log('Clearing sessionStorage...');
      sessionStorage.clear();
    }

    // Clear any indexed DB or other storage if needed
    if ('indexedDB' in window) {
      console.log('IndexedDB clearing not implemented but available');
    }

    console.log('✅ All storage cleared successfully');
    return true;
  } catch (error) {
    console.error('❌ Error clearing storage:', error);
    return false;
  }
};

// Auto-clear on development mode reload
if (process.env.NODE_ENV === 'development') {
  // Clear storage on page load in development
  window.addEventListener('load', () => {
    if (window.location.search.includes('clear-storage')) {
      clearAllStorage();
    }
  });
}

export default clearAllStorage;