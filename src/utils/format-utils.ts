
/**
 * Utility functions for formatting values
 */

/**
 * Format a number as currency
 * @param amount The amount to format
 * @param currency The currency code (default: USD)
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number, currency = 'USD'): string => {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  
  return formatter.format(amount);
};

/**
 * Format a date string to a readable format
 * @param dateString The date string to format
 * @returns Formatted date string
 */
export const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch (e) {
    if (import.meta.env.MODE === 'development') {
      console.error('Invalid date string:', dateString);
    }
    return dateString;
  }
};

/**
 * Format a date string to show only month and year
 * @param dateString The date string to format
 * @returns Formatted month and year string
 */
export const formatMonthYear = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
    });
  } catch (e) {
    if (import.meta.env.MODE === 'development') {
      console.error('Invalid date string:', dateString);
    }
    return dateString;
  }
};
