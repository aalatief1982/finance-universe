
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
  
  // Get the current page title from the route map
  const currentPageTitle = routeTitleMap[location.pathname] || 'Xpensia';
  
  // Check if we're on the landing page
  const isLandingPage = location.pathname === '/';
  
  // Don't show full header with navigation on sign in/sign up pages
  const isAuthPage = location.pathname === '/signin' || location.pathname === '/signup';
  
  // Determine if navigation should be shown based on props and other conditions
  const shouldShowNavigation = showNavigation && !isAuthPage && !isLandingPage && auth.isAuthenticated;
  
  // For auth pages, show a simplified header
  if (isAuthPage) {
    return <AuthHeader className={className} />;
  }
  
  return (
    <header className={cn(
      "sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border",
      className
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <LogoLink isLandingPage={isLandingPage} currentPageTitle={currentPageTitle} />
            
            {shouldShowNavigation && <MainNavigation />}
          </div>
          
          <div className="flex items-center">
            <UserMenu isLandingPage={isLandingPage} />
            
            {/* Mobile Navigation */}
            {shouldShowNavigation && <MobileNavigation currentPageTitle={currentPageTitle} />}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
