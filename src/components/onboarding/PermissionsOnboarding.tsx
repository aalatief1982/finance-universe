
import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, CheckCircle, ArrowRight, Smartphone } from 'lucide-react';
import { usePermissionFlow } from '@/hooks/usePermissionFlow';
import PermissionStep from './PermissionStep';

interface PermissionsOnboardingProps {
  onComplete: () => void;
}

const PermissionsOnboarding: React.FC<PermissionsOnboardingProps> = ({ onComplete }) => {
  const {
    state,
    nextStep,
    skipStep,
    requestSmsPermission,
    requestNotificationPermission,
    completeOnboarding,
  } = usePermissionFlow();

  const handleComplete = () => {
    completeOnboarding();
    onComplete();
  };

  // Skip entire flow if not Android
  if (!state.isAndroid) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md mx-auto"
      >
        <Card>
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Smartphone className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <CardTitle className="text-xl">Permissions Setup</CardTitle>
            <CardDescription>
              Permission setup is optimized for Android devices
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">
                You're using a web or iOS version of Xpensia. Permission management will be handled differently for your platform.
              </p>
            </div>
            <Button onClick={handleComplete} className="w-full">
              Continue to App
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Intro step
  if (state.currentStep === 'intro') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md mx-auto"
      >
        <Card>
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <CardTitle className="text-xl">Let's Set Up Your Permissions</CardTitle>
            <CardDescription>
              To provide the best experience, Xpensia needs access to certain features
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-full">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">SMS Reading</p>
                  <p className="text-sm text-gray-600">Automatically track expenses from bank SMS</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-full">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Notifications</p>
                  <p className="text-sm text-gray-600">Get alerts for important expense updates</p>
                </div>
              </div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Privacy First:</strong> Your data stays on your device. We never send your personal information to our servers.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Button onClick={nextStep} className="w-full">
                <ArrowRight className="mr-2 h-4 w-4" />
                Get Started
              </Button>
              <Button variant="outline" onClick={handleComplete} className="w-full">
                Skip Setup
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // SMS permission step
  if (state.currentStep === 'sms') {
    return (
      <PermissionStep
        type="sms"
        title="SMS Reading Permission"
        description="Allow Xpensia to read your SMS messages"
        explanation="This lets us automatically detect and categorize expenses from your bank SMS notifications, saving you time on manual entry."
        isGranted={state.permissionState.sms.granted}
        isRequested={state.permissionState.sms.requested}
        isLoading={state.isLoading}
        onRequest={requestSmsPermission}
        onSkip={() => skipStep('sms')}
      />
    );
  }

  // Notification permission step
  if (state.currentStep === 'notifications') {
    return (
      <PermissionStep
        type="notifications"
        title="Notification Permission"
        description="Stay updated with important expense alerts"
        explanation="Get notified when new expenses are detected, spending limits are reached, or when you need to review your budget."
        isGranted={state.permissionState.notifications.granted}
        isRequested={state.permissionState.notifications.requested}
        isLoading={state.isLoading}
        onRequest={requestNotificationPermission}
        onSkip={() => skipStep('notifications')}
      />
    );
  }

  // Complete step
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md mx-auto"
    >
      <Card>
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-xl">All Set!</CardTitle>
          <CardDescription>
            Your permissions have been configured
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium">SMS Reading</span>
              {state.permissionState.sms.granted ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <span className="text-xs text-gray-500">Skipped</span>
              )}
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium">Notifications</span>
              {state.permissionState.notifications.granted ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <span className="text-xs text-gray-500">Skipped</span>
              )}
            </div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-700">
              You can change these permissions anytime in Settings.
            </p>
          </div>
          <Button onClick={handleComplete} className="w-full">
            Continue to Xpensia
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default PermissionsOnboarding;
