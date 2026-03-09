
import React from 'react';
import { ChevronRight } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageContext';

interface WireframeHeaderProps {
  title?: string;
  onBack?: () => void;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
  contextTitle?: boolean;
}

// Map routes to their corresponding translation keys
const getRouteTitleKey = (pathname: string): string => {
  const routeMap: Record<string, string> = {
    '/': 'nav.home',
    '/dashboard': 'nav.home',
    '/transactions': 'nav.transactions',
    '/analytics': 'nav.analytics',
    '/process-sms': 'nav.importSms',
    '/settings': 'nav.settings',
    '/profile': 'nav.profile',
    '/sms-providers': 'nav.smsProviders',
    '/wireframes': 'wireframe.expenseTracker',
    '/wireframes/dashboard': 'nav.home',
    '/wireframes/onboarding': 'onboarding.startJourney',
    '/wireframes/add-transaction': 'nav.transaction',
    '/wireframes/reports': 'nav.analytics',
    '/wireframes/settings': 'nav.settings',
    '/wireframes/sms-provider': 'nav.smsProviders',
    '/wireframes/sms-transaction': 'wireframe.smartEntry',
  };
  return routeMap[pathname] || 'wireframe.expenseTracker';
};

const WireframeHeader = ({ 
  title, 
  onBack, 
  leftElement, 
  rightElement, 
  contextTitle = false 
}: WireframeHeaderProps) => {
  const location = useLocation();
  const { t } = useLanguage();
  
  // Determine the title to display
  const getDisplayTitle = () => {
    if (title) return title; // Explicitly provided title takes precedence
    if (contextTitle) {
      // Use route mapping for context-aware title
      const titleKey = getRouteTitleKey(location.pathname);
      return t(titleKey);
    }
    return title || t('wireframe.expenseTracker'); // Fallback to default
  };

  const displayTitle = getDisplayTitle();

  return (
    <div className="flex items-center bg-blue-600 text-white p-3 rounded-t-lg mb-4">
      {leftElement ? (
        leftElement
      ) : onBack ? (
        <button onClick={onBack} className="mr-2">
          <ChevronRight className="transform rotate-180" size={24} />
        </button>
      ) : (
        <div className="w-6"></div>
      )}
      <div className="flex-grow text-center font-bold">{displayTitle}</div>
      {rightElement ? rightElement : <div className="w-6"></div>}
    </div>
  );
};

export default WireframeHeader;
