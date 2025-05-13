
import React from 'react';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useUser } from '@/context/UserContext';
import { AuthHeader } from './AuthHeader';
import { LogoLink } from './LogoLink';
import { MainNavigation } from './MainNavigation';
import { UserMenu } from './UserMenu';
import { MobileNavigation } from './MobileNavigation';
import { routeTitleMap } from './route-constants';

interface HeaderProps {
  className?: string;
  showNavigation?: boolean;
}

const Header = ({ className, showNavigation = true }: HeaderProps) => {
  const location = useLocation();
  const { auth } = useUser();
  
  const currentPageTitle = routeTitleMap[location.pathname] || 'Xpensia';
  const isLandingPage = location.pathname === '/';
  const isAuthPage = location.pathname === '/signin' || location.pathname === '/signup';
  const shouldShowNavigation = showNavigation && !isAuthPage && !isLandingPage && auth.isAuthenticated;

  if (isAuthPage) {
    return <AuthHeader className={className} />;
  }

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 pt-[var(--safe-area-top)] bg-background/95 backdrop-blur-xl border-b border-border",
        className
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <LogoLink isLandingPage={isLandingPage} currentPageTitle={currentPageTitle} />
            {shouldShowNavigation && <MainNavigation />}
          </div>
          <div className="flex items-center">
            <UserMenu isLandingPage={isLandingPage} />
            {shouldShowNavigation && <MobileNavigation currentPageTitle={currentPageTitle} />}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
