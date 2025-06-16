
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
  BrainCircuit,
  Tag
} from 'lucide-react';
import { cn } from '@/lib/utils';

const Sidebar: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: Home },
    { name: 'Transactions', path: '/transactions', icon: BarChart3 },
    { name: 'Analytics', path: '/analytics', icon: LineChart },
    { name: 'Import Transactions', path: '/import-transactions', icon: Upload },
    { name: 'SMS Processing', path: '/process-sms', icon: MessageSquare },
    { name: 'Profile', path: '/profile', icon: User },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-card border-r border-border overflow-y-auto z-10">
      <div className="flex flex-col h-full">
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={cn(
                      "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors w-full",
                      isActive(item.path)
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <Icon className="mr-3 h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
