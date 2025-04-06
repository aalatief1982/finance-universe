
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
        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
          <span className="text-white font-semibold text-lg">X</span>
        </div>
        <span className="text-xl font-semibold tracking-tight">
          {isLandingPage ? 'Xpensia' : currentPageTitle}
        </span>
      </Link>
    </motion.div>
  );
};
