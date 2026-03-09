/**
 * @file ResponsiveFAB.tsx
 * @description Floating action button for adding transactions.
 */
import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/i18n/LanguageContext';

interface ResponsiveFABProps {
  onClick: () => void;
}

const ResponsiveFAB: React.FC<ResponsiveFABProps> = ({ onClick }) => {
  const { t } = useLanguage();

  return (
    <Button
      onClick={onClick}
      size="icon"
      className="md:hidden fixed bottom-16 ltr:right-4 rtl:left-4 z-40 h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg"
      aria-label={t('fab.addTransaction')}
    >
      <Plus className="h-5 w-5" />
    </Button>
  );
};

export default ResponsiveFAB;
