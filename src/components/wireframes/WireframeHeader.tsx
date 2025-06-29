
import React from 'react';
import { ChevronRight } from 'lucide-react';
import { useLocation } from 'react-router-dom';

interface WireframeHeaderProps {
  title?: string;
  onBack?: () => void;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
  contextTitle?: boolean;
}

// Map routes to their corresponding titles
const routeTitleMap: Record<string, string> = {
  '/': 'Home',
  '/dashboard': 'Dashboard',
  '/transactions': 'Transactions',
  '/analytics': 'Analytics',
  '/process-sms': 'Import SMS',
  '/settings': 'Settings',
  '/profile': 'Profile',
  '/sms-providers': 'SMS Providers',
  '/wireframes': 'Wireframes',
  '/wireframes/dashboard': 'Dashboard',
  '/wireframes/onboarding': 'Onboarding',
  '/wireframes/add-transaction': 'Add Transaction',
  '/wireframes/reports': 'Reports',
  '/wireframes/settings': 'Settings',
  '/wireframes/sms-provider': 'SMS Provider',
  '/wireframes/sms-transaction': 'SMS Transaction',
};

const WireframeHeader = ({ 
  title, 
  onBack, 
  leftElement, 
  rightElement, 
  contextTitle = false 
}: WireframeHeaderProps) => {
  const location = useLocation();
  
  // Determine the title to display
  const getDisplayTitle = () => {
    if (title) return title; // Explicitly provided title takes precedence
    if (contextTitle) {
      // Use route mapping for context-aware title
      return routeTitleMap[location.pathname] || 'Expense Tracker';
    }
    return title || 'Expense Tracker'; // Fallback to default
  };

  const displayTitle = getDisplayTitle();

  return (
    <div className="flex items-center bg-blue-600 text-white p-3 rounded-t-lg mb-4">
      {leftElement ? (
        leftElement
      ) : onBack ? (
        <button onClick={onBack} className="me-2">
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
