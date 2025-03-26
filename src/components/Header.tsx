
import React from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Home, PieChart, List, Settings, User } from 'lucide-react';

interface HeaderProps {
  className?: string;
}

const Header = ({ className }: HeaderProps) => {
  const location = useLocation();
  
  // Check if we're on the landing page
  const isLandingPage = location.pathname === '/';
  
  // Don't show full header with navigation on sign in/sign up pages
  const isAuthPage = location.pathname === '/signin' || location.pathname === '/signup';
  
  if (isAuthPage) {
    return (
      <header className={cn(
        "sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border",
        className
      )}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Link to="/" className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                  <span className="text-white font-semibold text-lg">E</span>
                </div>
                <span className="text-xl font-semibold tracking-tight">Expense Tracker</span>
              </Link>
            </motion.div>
          </div>
        </div>
      </header>
    );
  }
  
  // Navigation items - only show non-auth pages if not on landing page
  const navItems = !isLandingPage ? [
    { title: 'Dashboard', path: '/dashboard', icon: Home },
    { title: 'Analytics', path: '/analytics', icon: PieChart },
    { title: 'Transactions', path: '/transactions', icon: List },
    { title: 'Settings', path: '/settings', icon: Settings },
    { title: 'Profile', path: '/profile', icon: User },
  ] : [];
  
  // Auth links - only show on landing page
  const authLinks = isLandingPage ? (
    <div className="flex items-center space-x-4">
      <Link 
        to="/signin" 
        className="text-sm font-medium text-foreground hover:text-foreground/80 transition-colors"
      >
        Sign In
      </Link>
      <Link 
        to="/signup"
        className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        Sign Up
      </Link>
    </div>
  ) : (
    <div className="flex items-center space-x-1">
      <Link
        to="/profile"
        className="inline-flex items-center justify-center h-10 w-10 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        title="Profile"
      >
        <User size={20} />
      </Link>
    </div>
  );

  return (
    <header className={cn(
      "sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border",
      className
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Link to="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-white font-semibold text-lg">E</span>
              </div>
              <span className="text-xl font-semibold tracking-tight">Expense Tracker</span>
            </Link>
          </motion.div>
          
          {navItems.length > 0 && (
            <motion.nav
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="hidden md:block"
            >
              <ul className="flex items-center space-x-1">
                {navItems.map((item) => (
                  <li key={item.title}>
                    <Link 
                      to={item.path} 
                      className={cn(
                        "inline-flex items-center justify-center h-10 w-10 rounded-full hover:bg-secondary transition-colors",
                        location.pathname === item.path 
                          ? "text-foreground" 
                          : "text-muted-foreground hover:text-foreground"
                      )}
                      title={item.title}
                    >
                      <item.icon size={20} />
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.nav>
          )}
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            {authLinks}
          </motion.div>
        </div>
      </div>
    </header>
  );
};

export default Header;
