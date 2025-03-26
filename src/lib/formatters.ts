
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

export const formatShortDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date);
};

// Get a date string in YYYY-MM-DD format
export const dateToString = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// Group array of transactions by month - updated to handle optional date
export const groupByMonth = <T extends { date?: string }>(items: T[]): Record<string, T[]> => {
  return items.reduce((acc: Record<string, T[]>, item) => {
    // Skip items without a date property
    if (!item.date) return acc;
    
    const date = new Date(item.date);
    const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!acc[monthYear]) {
      acc[monthYear] = [];
    }
    
    acc[monthYear].push(item);
    return acc;
  }, {});
};
