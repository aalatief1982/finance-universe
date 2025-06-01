
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
    { name: 'Keyword Bank', path: '/keyword-bank', icon: Tag },
    { name: 'Master Mind', path: '/mastermind', icon: BrainCircuit },
    { name: 'Learning Tester', path: '/dev/learning-tester', icon: BrainCircuit },
    { name: 'Build Template', path: '/build-template', icon: BrainCircuit }
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-card border-r border-border z-10 overflow-y-auto">
      <div className="flex flex-col h-full">
        <div className="p-6">
          <h2 className="text-xl font-bold text-foreground">Xpensia</h2>
        </div>
        
        <nav className="flex-1 px-3 py-2">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={cn(
                      "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      isActive(item.path)
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <Icon className="mr-3 h-4 w-4" />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        
        <div className="p-4 border-t border-border">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <User className="h-4 w-4" />
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
