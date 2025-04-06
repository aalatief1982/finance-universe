
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AuthHeaderProps {
  className?: string;
}

export const AuthHeader: React.FC<AuthHeaderProps> = ({ className }) => {
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
                <span className="text-white font-semibold text-lg">X</span>
              </div>
              <span className="text-xl font-semibold tracking-tight">Xpensia</span>
            </Link>
          </motion.div>
        </div>
      </div>
    </header>
  );
};
