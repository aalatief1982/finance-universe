import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, List, BarChart3, Settings } from 'lucide-react';

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: Home },
  { name: 'Transactions', path: '/transactions', icon: List },
  { name: 'Reports', path: '/analytics', icon: BarChart3 },
  { name: 'Settings', path: '/settings', icon: Settings }
];

const BottomNav: React.FC = () => {
  const location = useLocation();
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-background border-t border-border">
      <ul className="flex justify-around py-2">
        {navItems.map(({ name, path, icon: Icon }) => (
          <li key={path}>
            <Link
              to={path}
              className={`flex flex-col items-center text-xs ${location.pathname === path ? 'text-primary' : 'text-muted-foreground'}`}
              aria-label={name}
            >
              <Icon size={20} />
              {name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default BottomNav;
