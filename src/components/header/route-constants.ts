
// Map routes to their corresponding titles
export const routeTitleMap: Record<string, string> = {
  '/': 'Home',
  '/dashboard': 'Dashboard',
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
  '/import-transactions': 'Import Transactions',
  '/dev/learning-tester': 'Learning Tester',
  '/mastermind': 'MasterMind',
};

// Navigation items that appear in the header
export const getNavItems = () => [
  { 
    title: 'Dashboard', 
    path: '/dashboard', 
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
    title: 'Import Transactions', 
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
    title: 'MasterMind', 
    path: '/mastermind', 
    icon: 'BrainCircuit', 
    description: 'View token mapping knowledge' 
  },
  { 
    title: 'Learning Tester', 
    path: '/dev/learning-tester', 
    icon: 'BrainCircuit', 
    description: 'Test and improve transaction parsing' 
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
