
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { XpensiaLogo } from './XpensiaLogo';

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
        <XpensiaLogo />
        <span className="text-xl font-semibold tracking-tight">
          {isLandingPage ? 'Xpensia' : currentPageTitle}
        </span>
      </Link>
    </motion.div>
  );
};
