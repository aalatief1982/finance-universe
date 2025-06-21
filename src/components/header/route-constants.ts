
// Map routes to their corresponding titles
export const routeTitleMap: Record<string, string> = {
  '/': 'Xpensia',
  '/home': 'Xpensia',
  '/transactions': 'Transactions',
  '/analytics': 'Analytics',
  '/process-sms': 'Process SMS',
  '/settings': 'Settings',
  '/profile': 'Profile',
  '/sms-providers': 'SMS Providers',
  '/wireframes': 'Wireframes',
  '/wireframes/dashboard': 'Dashboard',
  '/wireframes/onboarding': 'Onboarding',
  '/wireframes/add-transaction': 'Add Transaction',
  '/wireframes/reports': 'Reports',
  '/wireframes/settings': 'Settings',
  '/wireframes/sms-provider': 'SMS Provider',
  '/wireframes/sms-transaction': 'SMS Transaction',
  '/import-transactions': 'Extract Transaction Details',
  '/edit-transaction': 'Transaction',
};

// Navigation items that appear in the header
export const getNavItems = () => [
  { 
    title: 'Home', 
    path: '/home', 
    icon: 'Home', 
    description: 'Overview of your finances' 
  },
  { 
    title: 'Analytics', 
    path: '/analytics', 
    icon: 'PieChart', 
    description: 'Detailed reports and charts' 
  },
  { 
    title: 'Transactions', 
    path: '/transactions', 
    icon: 'List', 
    description: 'View and manage your transactions' 
  },
  {
    title: 'Extract Transaction Details',
    path: '/import-transactions',
    icon: 'Upload',
    description: 'Import transactions from SMS or paste'
  },
  { 
    title: 'Process SMS', 
    path: '/process-sms', 
    icon: 'MessageSquare', 
    description: 'Import transactions from SMS' 
  },
  {
    title: 'Settings',
    path: '/settings',
    icon: 'Settings',
    description: 'Configure app preferences'
  },
  { 
    title: 'Profile', 
    path: '/profile', 
    icon: 'User', 
    description: 'Manage your profile' 
  },
];
