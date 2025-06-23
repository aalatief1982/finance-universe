import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  ClipboardPaste,
  MessageSquareText,
  LineChart
} from 'lucide-react';

const navItems = [
  { name: 'Home', path: '/home', icon: Home, color: 'text-blue-600' },
  {
    name: 'Paste SMS',
    path: '/import-transactions',
    icon: ClipboardPaste,
    color: 'text-purple-600'
  },
  {
    name: 'Import SMS',
    path: '/process-sms',
    icon: MessageSquareText,
    color: 'text-green-600'
  },
  {
    name: 'Analytics',
    path: '/analytics',
    icon: LineChart,
    color: 'text-orange-600'
  }
];

const BottomNav: React.FC = () => {
  const location = useLocation();
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-background border-t border-border">
      <ul className="flex justify-around py-2">
        {navItems.map(({ name, path, icon: Icon, color }) => (
          <li key={path}>
            <Link
              to={path}
              className={`flex flex-col items-center text-xs ${location.pathname === path ? 'text-primary' : 'text-muted-foreground'}`}
              aria-label={name}
            >
              <Icon className={color} size={20} />
              {name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default BottomNav;
