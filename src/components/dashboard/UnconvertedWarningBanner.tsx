import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageContext';

interface UnconvertedWarningBannerProps {
  unconvertedCount: number;
  unconvertedCurrencies: string[];
  onDismiss?: () => void;
}

const UnconvertedWarningBanner: React.FC<UnconvertedWarningBannerProps> = ({
  unconvertedCount, unconvertedCurrencies, onDismiss,
}) => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  if (unconvertedCount === 0) return null;

  const currencyList = unconvertedCurrencies.slice(0, 3).join(', ');
  const hasMore = unconvertedCurrencies.length > 3;

  const titleKey = unconvertedCount > 1 ? 'fxBanner.missingRates' : 'fxBanner.missingRate';

  return (
    <Alert variant="default" className="mb-4 border-warning bg-warning/10">
      <AlertTriangle className="h-4 w-4 text-warning" />
      <AlertTitle className="text-warning font-medium">
        {t(titleKey).replace('{count}', String(unconvertedCount))}
      </AlertTitle>
      <AlertDescription className="text-sm text-muted-foreground">
        <p>
          {t('fxBanner.couldNotConvert')
            .replace('{currencies}', currencyList + (hasMore ? ` ${t('fxBanner.andMore').replace('{count}', String(unconvertedCurrencies.length - 3))}` : ''))}
        </p>
        <div className="flex gap-2 mt-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/transactions?filter=unconverted')}>
            {t('fxBanner.reviewTransactions')}
          </Button>
          {onDismiss && (
            <Button variant="ghost" size="sm" onClick={onDismiss}>{t('fxBanner.dismiss')}</Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default UnconvertedWarningBanner;
