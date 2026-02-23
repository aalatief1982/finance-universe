
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { XpensiaLogo } from './XpensiaLogo';
import { safeStorage } from '@/utils/safe-storage';

interface LogoLinkProps {
  isLandingPage: boolean;
  currentPageTitle: string;
  onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
}

export const LogoLink: React.FC<LogoLinkProps> = ({ isLandingPage, currentPageTitle, onClick }) => {
  const navigate = useNavigate();

  const handleLogoClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (safeStorage.getItem('xpensia_onb_done') === 'true') {
      event.preventDefault();
      event.stopPropagation();
      navigate('/home', { replace: true });
      return;
    }

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
