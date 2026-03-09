/**
 * @file FeedbackModal.tsx
 * @description UI component for FeedbackModal.
 *
 * @module components/FeedbackModal
 *
 * @responsibilities
 * 1. Render UI for the feature area
 * 2. Accept props and emit user interactions
 * 3. Compose shared subcomponents where needed
 *
 * @review-tags
 * - @ui: visual/layout behavior
 *
 * @review-checklist
 * - [ ] Props have sensible defaults
 * - [ ] Component renders without crashing
 */
import { safeStorage } from "@/utils/safe-storage";
import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
// Rating dropdown replaced with stars - select no longer used
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Star } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { Device } from '@capacitor/device';
import { App } from '@capacitor/app';
import { cn } from '@/lib/utils';
import { logAnalyticsEvent } from '@/utils/firebase-analytics';

interface FeedbackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Name of the screen/component where modal is opened */
  screenName: string;
}

const GOOGLE_FORM_ACTION_URL =  
  //'https://docs.google.com/forms/d/e/1FAIpQLSf7y12I4Un25LCbJFvkx-NM9UeSB1abFzqZChMAQWHAcSsr-g/formResponse';
  'https://docs.google.com/forms/d/e/1FAIpQLSed8vWDyDHZ372FAvD7sn4PC0vP7Hj7DKP8fDW2h4_l8HW1ng/formResponse';
const FIELD_DEVICE_INFO = 'entry.1975365589';
const FIELD_ISSUE = 'entry.1554778644';
const FIELD_LIKED = 'entry.1065342006';
const FIELD_IMPROVED = 'entry.856746959';
const FIELD_EMAIL = 'entry.1757542942';
const FIELD_RATING = 'entry.897318993';

const FeedbackModal: React.FC<FeedbackModalProps> = ({
  open,
  onOpenChange,
  screenName,
}) => {
  const { toast } = useToast();
  
  // Log when feedback modal opens
  useEffect(() => {
    if (open) {
      logAnalyticsEvent('feedback_open', {
        screen_name: screenName
      });
    }
  }, [open, screenName]);
  const [deviceInfo, setDeviceInfo] = useState('');
  const [issue, setIssue] = useState('');
  const [liked, setLiked] = useState('');
  const [improved, setImproved] = useState('');
  const [email, setEmail] = useState('');
  const [rating, setRating] = useState('');
  const [loading, setLoading] = useState(false);
  const [showEmailInput, setShowEmailInput] = useState(true);

  useEffect(() => {
    const loadInfo = async () => {
      try {
        type DeviceIdInfo = { identifier?: string };
        type AppInfoResult = { version?: string };

        const [info, id, appInfo] = await Promise.all([
          Device.getInfo(),
          Device.getId().catch((): DeviceIdInfo => ({ identifier: '' })),
          App.getInfo().catch((): AppInfoResult => ({ version: '' })),
        ]);
        const deviceId = typeof id.identifier === 'string' ? id.identifier : '';
        const version = typeof appInfo.version === 'string' && appInfo.version ? appInfo.version : '1.0.0';
        setDeviceInfo(`${info.model}, ${deviceId}, ${version}, ${screenName}`);
      } catch {
        // ignore failures
      }

      try {
        const stored = safeStorage.getItem('profile');
        if (stored) {
          const profile = JSON.parse(stored);
          if (profile?.email) {
            setEmail(profile.email);
            setShowEmailInput(false);
          }
        }
      } catch {
        // ignore
      }
    };

    loadInfo();
  }, [screenName]);

  const resetForm = () => {
    setDeviceInfo('');
    setIssue('');
    setLiked('');
    setImproved('');
    setEmail('');
    setRating('');
    setShowEmailInput(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!rating) {
      toast({
        title: t('toast.ratingRequired'),
        description: t('toast.ratingRequiredDesc'),
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const formData = new URLSearchParams();
      if (deviceInfo) formData.append(FIELD_DEVICE_INFO, deviceInfo);
      if (issue) formData.append(FIELD_ISSUE, issue);
      if (liked) formData.append(FIELD_LIKED, liked);
      if (improved) formData.append(FIELD_IMPROVED, improved);
      if (email) formData.append(FIELD_EMAIL, email);
      formData.append(FIELD_RATING, rating);

      await fetch(GOOGLE_FORM_ACTION_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      toast({ title: t('toast.feedbackSent'), description: t('toast.feedbackSentDesc') });
      
      // Log feedback send event
      logAnalyticsEvent('feedback_send', {
        screen_name: screenName,
        rating: rating,
        has_issue: !!issue,
        has_liked: !!liked,
        has_improved: !!improved,
        has_email: !!email
      });
      
      resetForm();
      onOpenChange(false);
    } catch (err) {
      toast({
        title: t('toast.feedbackFailed'),
        description: t('toast.feedbackFailedDesc'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-md max-h-[85dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Send Feedback</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="fb-issue" className="text-sm font-medium">
              What issue are you facing?
            </label>
            <Textarea
              id="fb-issue"
              value={issue}
              onChange={(e) => setIssue(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="fb-liked" className="text-sm font-medium">
              What did you like?
            </label>
            <Textarea
              id="fb-liked"
              value={liked}
              onChange={(e) => setLiked(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="fb-improved" className="text-sm font-medium">
              What can be improved?
            </label>
            <Textarea
              id="fb-improved"
              value={improved}
              onChange={(e) => setImproved(e.target.value)}
            />
          </div>
          {showEmailInput && (
            <div className="space-y-2">
              <label htmlFor="fb-email" className="text-sm font-medium">
                Optional email/contact
              </label>
              <Input
                id="fb-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          )}
          <div className="space-y-2">
            <label htmlFor="fb-rating" className="text-sm font-medium">
              Rate your experience
            </label>
            <div id="fb-rating" className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((num) => (
                <Star
                  key={num}
                  onClick={() => setRating(num.toString())}
                  className={cn(
                    'h-6 w-6 cursor-pointer',
                    parseInt(rating) >= num
                      ? 'text-yellow-500 fill-yellow-500'
                      : 'text-gray-400'
                  )}
                  fill={parseInt(rating) >= num ? 'currentColor' : 'none'}
                />
              ))}
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={loading || !rating}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Submit
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default FeedbackModal;
