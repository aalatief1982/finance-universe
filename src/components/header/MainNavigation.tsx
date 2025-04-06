
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { getNavItems } from './route-constants';
import * as Icons from 'lucide-react';

export const MainNavigation: React.FC = () => {
  const location = useLocation();
  const navItems = getNavItems();
  
  return (
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="hidden md:block ml-8"
    >
      <ul className="flex items-center space-x-1">
        {navItems.map((item) => {
          // Dynamically get the icon from lucide-react
          const IconComponent = Icons[item.icon as keyof typeof Icons];
          
          return (
            <li key={item.title}>
              <Link 
                to={item.path} 
                className={cn(
                  "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  location.pathname === item.path 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
                title={item.title}
                aria-current={location.pathname === item.path ? "page" : undefined}
              >
                {IconComponent && <IconComponent size={18} className="mr-2" />}
                {item.title}
              </Link>
            </li>
          );
        })}
      </ul>
    </motion.nav>
  );
};
