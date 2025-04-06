
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

interface LogoLinkProps {
  isLandingPage: boolean;
  currentPageTitle: string;
}

export const LogoLink: React.FC<LogoLinkProps> = ({ isLandingPage, currentPageTitle }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Link to="/" className="flex items-center space-x-2">
        <div className="h-8 w-8 rounded-lg bg-primary overflow-hidden flex items-center justify-center">
          <img 
            src="/xpensia-logo.png" 
            alt="Xpensia Logo" 
            className="w-full h-full object-cover"
          />
        </div>
        <span className="text-xl font-semibold tracking-tight">
          {isLandingPage ? 'Xpensia' : currentPageTitle}
        </span>
      </Link>
    </motion.div>
  );
};
