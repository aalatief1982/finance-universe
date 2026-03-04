import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { buildInferenceDTO } from '@/lib/inference/buildInferenceDTO';
import { getInbox, markSmsStatus, SmsInboxItem } from '@/lib/sms-inbox/smsInboxQueue';
import { isAdminMode } from '@/utils/admin-utils';

const amountPattern = /(?:\$|usd\s*)?(\d+[\d,]*(?:\.\d{1,2})?)/i;

const extractAmount = (body: string): string => {
  const match = body.match(amountPattern);
  return match ? match[0] : '—';
};

const SmsReviewInboxPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [pendingItems, setPendingItems] = React.useState<SmsInboxItem[]>([]);
  const adminEnabled = isAdminMode();

  const loadPendingItems = React.useCallback(() => {
    const items = getInbox()
      .filter((item) => item.status === 'new' || item.status === 'opened')
      .sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());

    setPendingItems(items);
  }, []);

  React.useEffect(() => {
    loadPendingItems();
  }, [loadPendingItems]);

  const handleReviewSms = React.useCallback(async (item: SmsInboxItem) => {
    try {
      const inferenceDTO = await buildInferenceDTO({
        rawMessage: item.body,
        senderHint: item.sender,
        source: 'sms',
      });

      markSmsStatus(item.id, 'opened');
      loadPendingItems();

      const continueState = {
        ...inferenceDTO,
        mode: 'create' as const,
        isSuggested: true,
        smsInboxId: item.id,
      };

      if (adminEnabled) {
        navigate('/engine-out', {
          state: {
            source: 'notification_review',
            inferenceDTO,
            continueState,
          },
        });
        return;
      }

      navigate('/edit-transaction', {
        state: continueState,
      });
    } catch (error) {
      console.error('[SmsReviewInboxPage] Failed to build inference DTO', {
        module: 'pages/SmsReviewInboxPage',
        fn: 'handleReviewSms',
        action: 'review',
        itemId: item.id,
        sender: item.sender,
        route: `${location.pathname}${location.search}${location.hash}`,
        error,
      });

      toast({
        title: 'Unable to open SMS',
        description: 'We could not open this SMS right now. Please try again.',
        variant: 'destructive',
      });
    }
  }, [adminEnabled, loadPendingItems, location.hash, location.pathname, location.search, navigate, toast]);

  const handleIgnoreSms = React.useCallback((id: string) => {
    markSmsStatus(id, 'ignored');
    loadPendingItems();
  }, [loadPendingItems]);

  return (
    <Layout withPadding={false} fullWidth showBack>
      <div className="px-1">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">SMS Review Inbox</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingItems.length === 0 ? (
              <div className="rounded-md border px-3 py-2 text-sm text-muted-foreground">
                No SMS transactions waiting for review.
              </div>
            ) : (
              pendingItems.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-3 rounded-md border p-3 md:flex-row md:items-center md:justify-between"
                >
                  <div className="min-w-0 space-y-1">
                    <p className="font-semibold">{item.sender}</p>
                    <p className="text-sm text-muted-foreground">Amount: {extractAmount(item.body)}</p>
                    <p className="text-sm text-muted-foreground">Date: {new Date(item.receivedAt).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button onClick={() => void handleReviewSms(item)}>
                      {item.status === 'opened' ? 'Continue' : 'Review'}
                    </Button>
                    <Button variant="destructive" onClick={() => handleIgnoreSms(item.id)}>Ignore</Button>
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
