
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { XpensiaLogo } from './XpensiaLogo';

interface LogoLinkProps {
  isLandingPage: boolean;
  currentPageTitle: string;
  onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
}

export const LogoLink: React.FC<LogoLinkProps> = ({ isLandingPage, currentPageTitle, onClick }) => {
  const handleLogoClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (!onClick) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    onClick(event);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Link to="/" className="flex items-center space-x-2" onClick={handleLogoClick}>
        <XpensiaLogo />
        <span className="text-xl font-semibold tracking-tight">
          {isLandingPage ? 'Xpensia' : currentPageTitle}
        </span>
      </Link>
    </motion.div>
  );
};
