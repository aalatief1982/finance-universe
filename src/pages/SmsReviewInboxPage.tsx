import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { buildInferenceDTO } from '@/lib/inference/buildInferenceDTO';
import { getInbox, markSmsStatus, SmsInboxItem } from '@/lib/sms-inbox/smsInboxQueue';
import { isAdminMode } from '@/utils/admin-utils';
import { useLanguage } from '@/i18n/LanguageContext';

const amountPattern = /(?:\$|usd\s*)?(\d+[\d,]*(?:\.\d{1,2})?)/i;

const extractAmount = (body: string): string => {
  const match = body.match(amountPattern);
  return match ? match[0] : '—';
};

const SmsReviewInboxPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [pendingItems, setPendingItems] = React.useState<SmsInboxItem[]>([]);
  const adminEnabled = isAdminMode();

  const loadPendingItems = React.useCallback(() => {
    const items = getInbox()
      .filter((item) => item.status === 'new' || item.status === 'opened')
      .sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());

    setPendingItems(items);
  }, []);

  const handleReviewSms = async (item: SmsInboxItem) => {
    markSmsStatus(item.id, 'opened');

    const dto = await buildInferenceDTO({ rawMessage: item.body, senderHint: item.sender });

    navigate('/review-sms-transactions', {
      state: {
        messages: [
          {
            body: item.body,
            sender: item.sender,
            timestamp: item.receivedAt,
          },
        ],
        smsInboxId: item.id,
        dto,
        returnTo: location.pathname,
      },
    });
  };

  const handleIgnoreSms = (id: string) => {
    markSmsStatus(id, 'ignored');
    loadPendingItems();
  };

  React.useEffect(() => {
    loadPendingItems();
  }, [loadPendingItems]);

  return (
    <Layout withPadding={false} fullWidth>
      <div className="px-1">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t('smsReview.title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingItems.length === 0 ? (
              <div className="rounded-md border px-3 py-2 text-sm text-muted-foreground">
                {t('smsReview.noItems')}
              </div>
            ) : (
              pendingItems.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-3 rounded-md border p-3 md:flex-row md:items-center md:justify-between"
                >
                  <div className="min-w-0 space-y-1">
                    <p className="font-semibold">{item.sender}</p>
                    <p className="text-sm text-muted-foreground">{t('smsReview.amount')} {extractAmount(item.body)}</p>
                    <p className="text-sm text-muted-foreground">{t('smsReview.date')} {new Date(item.receivedAt).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button onClick={() => void handleReviewSms(item)}>
                      {item.status === 'opened' ? t('smsReview.continue') : t('smsReview.review')}
                    </Button>
                    <Button variant="destructive" onClick={() => handleIgnoreSms(item.id)}>{t('smsReview.ignore')}</Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default SmsReviewInboxPage;
