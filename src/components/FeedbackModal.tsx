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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { Device } from '@capacitor/device';

interface FeedbackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const GOOGLE_FORM_ACTION_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSf7y12I4Un25LCbJFvkx-NM9UeSB1abFzqZhMAQWHAcSsr-g/formResponse';

const FIELD_DEVICE_INFO = 'entry.1975365589';
const FIELD_ISSUE = 'entry.1554778644';
const FIELD_LIKED = 'entry.1065342006';
const FIELD_IMPROVED = 'entry.856746959';
const FIELD_EMAIL = 'entry.1757542942';
const FIELD_RATING = 'entry.897318993';

const FeedbackModal: React.FC<FeedbackModalProps> = ({ open, onOpenChange }) => {
  const { toast } = useToast();
  const [deviceInfo, setDeviceInfo] = useState('');
  const [issue, setIssue] = useState('');
  const [liked, setLiked] = useState('');
  const [improved, setImproved] = useState('');
  const [email, setEmail] = useState('');
  const [rating, setRating] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Device.getInfo()
      .then((info) => {
        setDeviceInfo(`${info.operatingSystem} ${info.osVersion} - ${info.model}`);
      })
      .catch(() => {
        // ignore failures
      });
  }, []);

  const resetForm = () => {
    setDeviceInfo('');
    setIssue('');
    setLiked('');
    setImproved('');
    setEmail('');
    setRating('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!rating) {
      toast({
        title: 'Missing rating',
        description: 'Please select a rating between 1 and 5.',
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

      toast({ title: 'Feedback sent', description: 'Thank you for your feedback!' });
      resetForm();
      onOpenChange(false);
    } catch (err) {
      toast({
        title: 'Submission failed',
        description: 'Could not send feedback. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send Feedback</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="fb-device" className="text-sm font-medium">
              Device Info
            </label>
            <Input
              id="fb-device"
              value={deviceInfo}
              onChange={(e) => setDeviceInfo(e.target.value)}
            />
          </div>
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
          <div className="space-y-2">
            <label htmlFor="fb-rating" className="text-sm font-medium">
              Rate your experience
            </label>
            <Select value={rating} onValueChange={(v) => setRating(v)}>
              <SelectTrigger id="fb-rating">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="3">3</SelectItem>
                <SelectItem value="4">4</SelectItem>
                <SelectItem value="5">5</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Submit
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default FeedbackModal;
