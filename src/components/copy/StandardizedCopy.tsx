// Standardized copy constants for consistent messaging across the app
export const COPY = {
  // Navigation
  NAV: {
    DASHBOARD: 'Dashboard',
    TRANSACTIONS: 'Transactions',
    ANALYTICS: 'Analytics',
    SETTINGS: 'Settings',
    PROFILE: 'Profile'
  },

  // Buttons
  BUTTONS: {
    SAVE: 'Save Changes',
    CANCEL: 'Cancel',
    DELETE: 'Delete',
    EDIT: 'Edit',
    ADD: 'Add New',
    IMPORT: 'Import',
    EXPORT: 'Export',
    UPLOAD: 'Upload',
    DOWNLOAD: 'Download',
    SUBMIT: 'Submit',
    CONFIRM: 'Confirm',
    RETRY: 'Try Again',
    BACK: 'Go Back',
    NEXT: 'Continue',
    FINISH: 'Complete'
  },

  // Forms
  FORMS: {
    REQUIRED_FIELD: 'This field is required',
    INVALID_EMAIL: 'Please enter a valid email address',
    INVALID_AMOUNT: 'Please enter a valid amount',
    INVALID_DATE: 'Please select a valid date',
    PASSWORD_TOO_SHORT: 'Password must be at least 8 characters',
    PASSWORDS_DONT_MATCH: 'Passwords do not match',
    SELECT_OPTION: 'Please select an option',
    ENTER_DESCRIPTION: 'Enter a description...',
    OPTIONAL_FIELD: '(Optional)'
  },

  // Transaction specific
  TRANSACTIONS: {
    ADD_TRANSACTION: 'Add Transaction',
    EDIT_TRANSACTION: 'Edit Transaction',
    DELETE_TRANSACTION: 'Delete Transaction',
    NO_TRANSACTIONS: 'No transactions found',
    TRANSACTION_SAVED: 'Transaction saved successfully',
    TRANSACTION_DELETED: 'Transaction deleted successfully',
    SELECT_CATEGORY: 'Select a category',
    SELECT_TYPE: 'Select transaction type',
    AMOUNT_PLACEHOLDER: '0.00',
    DESCRIPTION_PLACEHOLDER: 'What was this transaction for?',
    SEARCH_TRANSACTIONS: 'Search transactions...'
  },

  // Status messages
  STATUS: {
    LOADING: 'Loading...',
    SAVING: 'Saving...',
    SAVED: 'Saved!',
    ERROR: 'Something went wrong',
    SUCCESS: 'Success!',
    PROCESSING: 'Processing...',
    UPLOADING: 'Uploading...',
    UPLOADED: 'Upload complete',
    CONNECTING: 'Connecting...',
    CONNECTED: 'Connected',
    DISCONNECTED: 'Connection lost'
  },

  // Empty states
  EMPTY_STATES: {
    NO_DATA: 'No data available',
    NO_RESULTS: 'No results found',
    NO_TRANSACTIONS: 'You haven\'t added any transactions yet',
    NO_CATEGORIES: 'No categories available',
    NO_ACCOUNTS: 'No accounts configured',
    START_TRACKING: 'Start tracking your expenses today!'
  },

  // Confirmation messages
  CONFIRMATIONS: {
    DELETE_TRANSACTION: 'Are you sure you want to delete this transaction? This action cannot be undone.',
    DELETE_CATEGORY: 'Are you sure you want to delete this category?',
    CLEAR_DATA: 'This will permanently delete all your data. Are you sure?',
    LOGOUT: 'Are you sure you want to sign out?',
    UNSAVED_CHANGES: 'You have unsaved changes. Do you want to save them before leaving?'
  },

  // Analytics
  ANALYTICS: {
    TOTAL_INCOME: 'Total Income',
    TOTAL_EXPENSES: 'Total Expenses',
    NET_BALANCE: 'Net Balance',
    THIS_MONTH: 'This Month',
    LAST_MONTH: 'Last Month',
    YEAR_TO_DATE: 'Year to Date',
    SPENDING_BY_CATEGORY: 'Spending by Category',
    INCOME_VS_EXPENSES: 'Income vs Expenses',
    MONTHLY_TRENDS: 'Monthly Trends'
  },

  // Settings
  SETTINGS: {
    GENERAL: 'General Settings',
    ACCOUNT: 'Account Settings',
    NOTIFICATIONS: 'Notifications',
    PRIVACY: 'Privacy & Security',
    DATA: 'Data Management',
    CATEGORIES: 'Categories',
    CURRENCY: 'Currency Settings',
    THEME: 'Appearance',
    LANGUAGE: 'Language'
  },

  // Tooltips and help text
  HELP: {
    SMART_PASTE: 'Paste bank SMS or transaction text to automatically extract details',
    CATEGORY_HIERARCHY: 'Organize your expenses with categories and subcategories',
    BUDGET_TRACKING: 'Set monthly budgets to track your spending goals',
    DATA_EXPORT: 'Export your data as CSV or PDF for external analysis',
    LEARNING_ENGINE: 'The app learns from your patterns to suggest better categorization'
  }
} as const;

// Type for accessing copy values
export type CopyKeys = typeof COPY;