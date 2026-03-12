import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { buildInferenceDTO } from '@/lib/inference/buildInferenceDTO';
import { getInbox, markSmsStatus, SmsInboxItem, subscribeInbox } from '@/lib/sms-inbox/smsInboxQueue';
import { isAdminMode } from '@/utils/admin-utils';
import { useLanguage } from '@/i18n/LanguageContext';
import { Skeleton } from '@/components/ui/skeleton';
import type { InferenceDTO } from '@/types/inference';
import { useSyncExternalStore } from 'react';

const DEBUG_SMS_REVIEW_PREFIX = '[DEBUG_SMS_REVIEW_FIX]';

interface EnrichedItem {
  item: SmsInboxItem;
  dto: InferenceDTO | null;
  loading: boolean;
}

const formatAmount = (dto: InferenceDTO | null, body: string): string => {
  if (dto?.transaction?.amount && dto.transaction.amount !== 0) {
    const currency = dto.transaction.currency || '';
    return `${currency} ${dto.transaction.amount.toLocaleString()}`.trim();
  }
  // Fallback: regex from body
  const match = body.match(/(?:\$|usd\s*)?(\d+[\d,]*(?:\.\d{1,2})?)/i);
  return match ? match[0] : '—';
};

const formatDate = (dto: InferenceDTO | null, receivedAt: string): string => {
  if (dto?.transaction?.date) {
    return dto.transaction.date;
  }
  return new Date(receivedAt).toLocaleDateString();
};

const getPayee = (dto: InferenceDTO | null): string => {
  if (!dto) return '—';

  const vendor = dto.transaction?.vendor?.trim();
  if (vendor) return vendor;

  const person = dto.transaction?.person?.trim();
  if (person) return person;

  const title = dto.transaction?.title;
  if (title && title !== 'SMS transaction' && !title.startsWith('SMS from ')) {
    return title;
  }
  return '—';
};

const SmsReviewInboxPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [enrichedItems, setEnrichedItems] = React.useState<EnrichedItem[]>([]);
  const adminEnabled = isAdminMode();
  const inboxVersion = useSyncExternalStore(subscribeInbox, () => getInbox().length, () => 0);

  const loadAndEnrichItems = React.useCallback(async () => {
    const items = getInbox()
      .filter((item) => item.status === 'new' || item.status === 'opened')
      .sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());

    // Set items immediately with loading state
    setEnrichedItems(items.map((item) => ({ item, dto: null, loading: true })));

    // Enrich all in parallel
    const enriched = await Promise.all(
      items.map(async (item) => {
        try {
          const dto = await buildInferenceDTO({ rawMessage: item.body, senderHint: item.sender });
          return { item, dto, loading: false };
        } catch {
          return { item, dto: null, loading: false };
        }
      })
    );

    setEnrichedItems(enriched);
  }, []);

  const handleReviewSms = async (item: SmsInboxItem, cachedDto: InferenceDTO | null) => {
    try {
      console.log(`${DEBUG_SMS_REVIEW_PREFIX} Review click entry`, {
        itemId: item.id,
        sender: item.sender,
        status: item.status,
        hasCachedDto: Boolean(cachedDto),
      });

      markSmsStatus(item.id, 'opened');

      console.log(`${DEBUG_SMS_REVIEW_PREFIX} Before parse/build DTO`, {
        itemId: item.id,
        hasCachedDto: Boolean(cachedDto),
      });

      const dto = cachedDto ?? await buildInferenceDTO({ rawMessage: item.body, senderHint: item.sender });

      if (!dto) {
        console.warn(`${DEBUG_SMS_REVIEW_PREFIX} Early return: DTO missing`, { itemId: item.id });
        return;
      }

      console.log(`${DEBUG_SMS_REVIEW_PREFIX} After parse/build DTO success`, {
        itemId: item.id,
        title: dto.transaction?.title,
        vendor: dto.transaction?.vendor,
        amount: dto.transaction?.amount,
      });

      console.log(`${DEBUG_SMS_REVIEW_PREFIX} Before navigation`, {
        itemId: item.id,
        destination: '/edit-transaction',
      });

      navigate('/edit-transaction', {
        state: {
          ...dto,
          smsInboxId: item.id,
          returnTo: location.pathname,
        },
      });
    } catch (error) {
      console.error(`${DEBUG_SMS_REVIEW_PREFIX} Error in Review flow`, {
        itemId: item.id,
        sender: item.sender,
        error,
      });

      toast({
        title: t('toast.couldNotOpenSms'),
        description: t('toast.pleaseTryAgain'),
        variant: 'destructive',
      });
    }
  };

  const handleIgnoreSms = (id: string) => {
    markSmsStatus(id, 'ignored');
    setEnrichedItems((prev) => prev.filter((e) => e.item.id !== id));
  };

  React.useEffect(() => {
    void loadAndEnrichItems();
  }, [loadAndEnrichItems, inboxVersion, location.key, location.state]);

  return (
    <Layout withPadding={false} fullWidth>
      <div className="px-1">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t('smsReview.title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {enrichedItems.length === 0 ? (
              <div className="rounded-md border px-3 py-2 text-sm text-muted-foreground">
                {t('smsReview.noItems')}
              </div>
            ) : (
              enrichedItems.map(({ item, dto, loading }) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-3 rounded-md border p-3 md:flex-row md:items-center md:justify-between"
                >
                  <div className="min-w-0 space-y-1">
                    <p className="text-xs text-muted-foreground">{item.sender}</p>
                    {loading ? (
                      <>
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </>
                    ) : (
                      <>
                        <p className="font-semibold">{getPayee(dto)}</p>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span>{formatAmount(dto, item.body)}</span>
                          <span>·</span>
                          <span>{formatDate(dto, item.receivedAt)}</span>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button onClick={() => void handleReviewSms(item, dto)}>
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
