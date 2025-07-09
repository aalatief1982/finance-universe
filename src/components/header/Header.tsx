import React from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useUser } from '@/context/UserContext';
import { AuthHeader } from './AuthHeader';
import { LogoLink } from './LogoLink';
import { MainNavigation } from './MainNavigation';
import { UserMenu } from './UserMenu';
import { MobileNavigation } from './MobileNavigation';
import { routeTitleMap } from './route-constants';
import { Settings, ArrowLeft, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { openFeedbackForm } from '@/components/FeedbackButton';

interface HeaderProps {
  className?: string;
  showNavigation?: boolean;
  showBack?: boolean;
}

const Header = ({ className, showNavigation = true, showBack = false }: HeaderProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { auth } = useUser();
  
  const currentPageTitle =
    routeTitleMap[location.pathname] ||
    (location.pathname.startsWith('/edit-transaction') ? 'Transaction' : 'Xpensia');
  const isLandingPage = location.pathname === '/';
  const isAuthPage = location.pathname === '/onboarding';
  // Show navigation on all pages except landing and onboarding
  const shouldShowNavigation =
    showNavigation &&
    !isAuthPage &&
    !isLandingPage;

  // Show mobile menu and settings on all pages except onboarding
  const showMobileIcons = !isAuthPage;
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
            {showBack && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="mr-2"
              >
                <ArrowLeft size={20} />
              </Button>
            )}
            <LogoLink isLandingPage={isLandingPage} currentPageTitle={currentPageTitle} />
            {shouldShowNavigation && <MainNavigation />}
          </div>
          <div className="flex items-center">
            <UserMenu isLandingPage={isLandingPage} />
            <Button
              variant="ghost"
              size="icon"
              onClick={openFeedbackForm}
              className="ml-2"
              title="Feedback"
              aria-label="Feedback"
            >
              <MessageSquare size={20} />
            </Button>
            {showMobileIcons && (
              <>
                <MobileNavigation currentPageTitle={currentPageTitle} />
                <Link
                  to="/settings"
                  className="ml-2 md:hidden"
                  title="App Settings"
                  aria-label="App Settings"
                >
                  <Settings size={20} />
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
export default Header;
