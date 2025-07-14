import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Upload, List, LineChart } from 'lucide-react';

const navItems = [
  { name: 'Home', path: '/home', icon: Home, color: 'text-primary' },
  { name: 'Paste SMS', path: '/import-transactions', icon: Upload, color: 'text-success' },
  { name: 'Transactions', path: '/transactions', icon: List, color: 'text-secondary' },
  { name: 'Analytics', path: '/analytics', icon: LineChart, color: 'text-accent' }
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
              className={`flex flex-col items-center text-xs ${location.pathname === path ? color : 'text-muted-foreground'}`}
            aria-label={name}
          >
              <Icon size={20} className={location.pathname === path ? color : ''} />
              {name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default BottomNav;
