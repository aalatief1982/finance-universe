import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LineChart, 
  Home, 
  BarChart3, 
  MessageSquare, 
  Settings,
  User,
  Upload,
  BrainCircuit,Tag
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { name: 'Home', path: '/home', icon: <Home size={20} /> },
    { name: 'Transactions', path: '/transactions', icon: <BarChart3 size={20} /> },
    { name: 'Analytics', path: '/analytics', icon: <LineChart size={20} /> },
    { name: 'Paste & Parse', path: '/import-transactions', icon: <Upload size={20} /> },
    { name: 'NER Paste', path: '/import-transactions-ner', icon: <Upload size={20} /> },
    { name: 'Import SMS', path: '/process-sms', icon: <MessageSquare size={20} /> },
    { name: 'Profile', path: '/profile', icon: <User size={20} /> },
    { name: 'Settings', path: '/settings', icon: <Settings size={20} /> },
	{ name: 'Keyword Bank', path: '/keyword-bank', icon: <Tag size={20} /> },
    { name: 'Build Template', path: '/build-template', icon: <BrainCircuit size={20} /> }

  ];

  const budgetItems = [
    { name: 'Accounts & Balances', path: '/budget/accounts' },
    { name: 'Set Budget', path: '/budget/set' },
    { name: 'Budget vs Actual', path: '/budget/report' },
    { name: 'Suggestions & Insights', path: '/budget/insights' }
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="fixed top-0 left-0 h-full w-64 bg-background border-r border-border z-10 shadow-sm">
      <div className="flex flex-col h-full">
        <div className="px-[var(--page-padding-x)] py-[var(--page-padding-y)]">
          <h2 className="text-xl font-bold">Xpensia</h2>
        </div>
        
        <nav className="flex-1 px-3 py-2">
          <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(item.path)
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                {item.name}
              </Link>
            </li>
          ))}
            <li>
              <details open>
                <summary className="flex items-center px-3 py-2 rounded-md text-sm font-medium cursor-pointer select-none">
                  Budget ▾
                </summary>
                <ul className="mt-1 ml-4 space-y-1">
                  {budgetItems.map(b => (
                    <li key={b.path}>
                      <Link
                        to={b.path}
                        className={`block px-3 py-1 rounded-md text-sm transition-colors ${isActive(b.path) ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                      >
                        {b.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </details>
            </li>
          </ul>
        </nav>
        
        <div className="p-4 border-t border-border">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <User size={16} />
            </div>
            <div className="ml-2">
              <p className="text-sm font-medium">User Profile</p>
              <p className="text-xs text-muted-foreground">Manage Account</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
