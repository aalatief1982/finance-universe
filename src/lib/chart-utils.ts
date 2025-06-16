
// Chart utility functions for dashboard
export const generateChartData = (period: 'week' | 'month' | 'year' = 'month') => {
  const data = [];
  const now = new Date();
  
  if (period === 'week') {
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      data.push({
        name: date.toLocaleDateString('en-US', { weekday: 'short' }),
        income: Math.floor(Math.random() * 1000) + 500,
        expenses: Math.floor(Math.random() * 800) + 300,
      });
    }
  } else if (period === 'month') {
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      data.push({
        name: date.getDate().toString(),
        income: Math.floor(Math.random() * 1000) + 500,
        expenses: Math.floor(Math.random() * 800) + 300,
      });
    }
  } else {
    // year
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now);
      date.setMonth(date.getMonth() - i);
      data.push({
        name: date.toLocaleDateString('en-US', { month: 'short' }),
        income: Math.floor(Math.random() * 10000) + 5000,
        expenses: Math.floor(Math.random() * 8000) + 3000,
      });
    }
  }
  
  return data;
};
