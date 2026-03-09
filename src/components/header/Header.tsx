import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { LogoLink } from './LogoLink';
import { MainNavigation } from './MainNavigation';
import { MobileNavigation } from './MobileNavigation';
import { getRouteTitleMap } from './route-constants';
import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSmsInboxPendingCount } from '@/hooks/useSmsInboxPendingCount';
import FeedbackModal from '@/components/FeedbackModal';
import { useLanguage } from '@/i18n/LanguageContext';

interface HeaderProps {
  className?: string;
  showNavigation?: boolean;
  onLogoClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
}

const Header = ({ className, showNavigation = true, onLogoClick }: HeaderProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const pendingSmsCount = useSmsInboxPendingCount();
  const [feedbackOpen, setFeedbackOpen] = React.useState(false);
  const { t } = useLanguage();
  const routeTitleMap = getRouteTitleMap(t);
  
  const currentPageTitle =
    routeTitleMap[location.pathname] ||
    (location.pathname.startsWith('/edit-transaction') ? t('nav.transaction') : 'Xpensia');
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
        "fixed top-0 inset-x-0 z-50 pt-[var(--safe-area-top)] bg-background border-b border-border",
        "will-change-transform [transform:translateZ(0)] [backface-visibility:hidden]",
        className
      )}
    >
      <div className="max-w-7xl mx-auto h-[var(--header-height)] px-4 sm:px-6 lg:px-8">
        <div className="flex h-full items-center justify-between">
          <div className="flex items-center">
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
              className="relative ml-2 h-11 w-11 p-0"
              title="SMS Review Inbox"
              aria-label="SMS Review Inbox"
            >
              <Mail size={39} />
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
