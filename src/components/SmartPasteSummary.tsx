import React from 'react';
import { Card } from './ui/card';
import { useLanguage } from '@/i18n/LanguageContext';

interface Props {
  confidence: number;
  matchedCount?: number;
  totalTemplates?: number;
  fieldScore?: number;
  keywordScore?: number;
}

const SmartPasteSummary: React.FC<Props> = ({
  confidence, matchedCount, totalTemplates, fieldScore, keywordScore,
}) => {
  const { t } = useLanguage();

  const qualityLabel =
    confidence >= 0.8
      ? t('smartPaste.looksGood')
      : confidence >= 0.5
      ? t('smartPaste.needsQuickReview')
      : t('smartPaste.needsCarefulReview');

  return (
    <Card className="bg-accent/10 border-l-4 rtl:border-l-0 rtl:border-r-4 border-accent text-accent-foreground p-[var(--card-padding)] text-sm rounded-md">
      <h2 className="font-semibold mb-2 text-accent">{t('smartPaste.reviewBeforeSaving')}</h2>
      <ul className="list-disc ltr:list-inside rtl:list-inside space-y-1">
        <li>{t('smartPaste.qualityCheck')}: <strong>{qualityLabel}</strong></li>
        <li>{t('smartPaste.confidenceEstimate')}: <strong>{(confidence * 100).toFixed(0)}%</strong></li>
        {typeof fieldScore === 'number' && fieldScore < 0.75 && (
          <li>{t('smartPaste.detailsNeedConfirmation')}</li>
        )}
        {typeof keywordScore === 'number' && keywordScore < 0.5 && (
          <li>{t('smartPaste.categoryNeedsReview')}</li>
        )}
        <li>{t('smartPaste.savingHelps')}</li>
      </ul>

      {typeof matchedCount === 'number' && typeof totalTemplates === 'number' && (
        <p className="mt-2 text-xs text-muted-foreground">{t('smartPaste.usedPastConfirmations')}</p>
      )}
    </Card>
  );
};

export default SmartPasteSummary;
