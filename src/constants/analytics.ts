
// Chart colors palette
export const CHART_COLORS = [
  '#007bff', '#28a745', '#ffc107', '#dc3545',
  '#6f42c1', '#6c757d'
];

// Time period options
export const TIME_PERIODS = [
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'year', label: 'This Year' },
  { value: 'all', label: 'All Time' },
];

// Transaction types for filtering
export const TRANSACTION_TYPES = [
  { value: 'all', label: 'All Transactions' },
  { value: 'income', label: 'Income Only' },
  { value: 'expense', label: 'Expenses Only' },
];

// Chart types
export const CHART_TYPES = [
  { value: 'bar', label: 'Bar Chart', icon: 'BarChart' },
  { value: 'pie', label: 'Pie Chart', icon: 'PieChart' },
  { value: 'line', label: 'Line Chart', icon: 'LineChart' },
];

// Default chart configurations
export const DEFAULT_CHART_CONFIG = {
  barChart: {
    margin: { top: 20, right: 30, left: 20, bottom: 5 },
    barSize: 20,
    barGap: 5,
  },
  pieChart: {
    margin: { top: 20, right: 30, left: 20, bottom: 5 },
    innerRadius: 60,
    outerRadius: 80,
  },
  lineChart: {
    margin: { top: 20, right: 30, left: 20, bottom: 5 },
    lineType: 'monotone',
  },
};
