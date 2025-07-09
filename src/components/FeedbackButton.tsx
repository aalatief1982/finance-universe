import React from "react";
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import { Button } from "@/components/ui/button";
import { FirebaseAnalytics } from '@capacitor-firebase/analytics';

const GOOGLE_FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSf7y12I4Un25LCbJFvkx-NM9UeSB1abFzqZChMAQWHAcSsr-g/formResponse";

interface FeedbackButtonProps {
  className?: string;
}

export const openFeedbackForm = async () => {
  try {
    if (Capacitor.isNativePlatform()) {
      await Browser.open({ url: GOOGLE_FORM_URL });
    } else {
      window.open(GOOGLE_FORM_URL, "_blank");
    }
    FirebaseAnalytics.logEvent({ name: 'send_feedback' });
  } catch (err) {
    console.error("Failed to open feedback form:", err);
  }
};

const FeedbackButton: React.FC<FeedbackButtonProps> = ({ className }) => {

  return (
    <Button onClick={openFeedbackForm} className={className}>
      Send Feedback
    </Button>
  );
};

export default FeedbackButton;