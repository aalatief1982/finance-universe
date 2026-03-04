import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { navigateBackSafely } from '@/utils/navigation';
import { cn } from '@/lib/utils';
import { LogoLink } from './LogoLink';
import { MainNavigation } from './MainNavigation';
import { MobileNavigation } from './MobileNavigation';
import { routeTitleMap } from './route-constants';
import { ArrowLeft, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSmsInboxPendingCount } from '@/hooks/useSmsInboxPendingCount';
import FeedbackModal from '@/components/FeedbackModal';

interface HeaderProps {
  className?: string;
  showNavigation?: boolean;
  showBack?: boolean;
  onBack?: () => void;
  onLogoClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
}

const Header = ({ className, showNavigation = true, showBack = false, onBack, onLogoClick }: HeaderProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const pendingSmsCount = useSmsInboxPendingCount();
  const [feedbackOpen, setFeedbackOpen] = React.useState(false);
  
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
    <>
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 pt-[var(--safe-area-top)] bg-background border-b border-border",
        "will-change-transform [transform:translateZ(0)] [backface-visibility:hidden]",
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
                onClick={() => {
                  if (onBack) {
                    onBack();
                    return;
                  }
                  navigateBackSafely(navigate);
                }}
                className="mr-2"
              >
                <ArrowLeft size={20} />
              </Button>
            )}
            <LogoLink
              isLandingPage={isLandingPage}
              currentPageTitle={currentPageTitle}
              onClick={onLogoClick}
            />
            {shouldShowNavigation && <MainNavigation />}
          </div>
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/sms-review')}
              className="relative ml-2 h-11 w-11 p-0 [&_svg]:size-7"
              title="SMS Review Inbox"
              aria-label="SMS Review Inbox"
            >
              <Mail />
              {pendingSmsCount > 0 && (
                <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-destructive px-1 text-center text-[10px] leading-4 text-destructive-foreground">
                  {pendingSmsCount}
                </span>
              )}
            </Button>
            {showMobileIcons && (
              <MobileNavigation currentPageTitle={currentPageTitle} onOpenFeedback={() => setFeedbackOpen(true)} />
            )}
          </div>
        </div>
      </div>
    </header>
    <FeedbackModal
      open={feedbackOpen}
      onOpenChange={setFeedbackOpen}
      screenName={currentPageTitle}
    />
    </>
  );
};
export default Header;
