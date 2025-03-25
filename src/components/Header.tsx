
import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Home, PieChart, List, Settings } from 'lucide-react';

interface HeaderProps {
  className?: string;
}

const Header = ({ className }: HeaderProps) => {
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
          
          <motion.nav
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <ul className="flex items-center space-x-1">
              <li>
                <Link 
                  to="/" 
                  className="inline-flex items-center justify-center h-10 w-10 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                  title="Dashboard"
                >
                  <Home size={20} />
                </Link>
              </li>
              <li>
                <Link 
                  to="/analytics" 
                  className="inline-flex items-center justify-center h-10 w-10 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                  title="Analytics"
                >
                  <PieChart size={20} />
                </Link>
              </li>
              <li>
                <Link 
                  to="/transactions" 
                  className="inline-flex items-center justify-center h-10 w-10 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                  title="Transactions"
                >
                  <List size={20} />
                </Link>
              </li>
              <li>
                <Link 
                  to="/settings" 
                  className="inline-flex items-center justify-center h-10 w-10 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                  title="Settings"
                >
                  <Settings size={20} />
                </Link>
              </li>
            </ul>
          </motion.nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
