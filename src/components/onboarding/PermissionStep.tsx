
import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Bell, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface PermissionStepProps {
  type: 'sms' | 'notifications';
  title: string;
  description: string;
  explanation: string;
  isGranted: boolean;
  isRequested: boolean;
  isLoading: boolean;
  onRequest: () => void;
  onSkip: () => void;
}

const PermissionStep: React.FC<PermissionStepProps> = ({
  type,
  title,
  description,
  explanation,
  isGranted,
  isRequested,
  isLoading,
  onRequest,
  onSkip,
}) => {
  const Icon = type === 'sms' ? MessageSquare : Bell;

  const getStatusIcon = () => {
    if (isLoading) return <Loader2 className="h-6 w-6 animate-spin text-blue-500" />;
    if (isRequested && isGranted) return <CheckCircle className="h-6 w-6 text-green-500" />;
    if (isRequested && !isGranted) return <XCircle className="h-6 w-6 text-red-500" />;
    return null;
  };

  const getStatusText = () => {
    if (isLoading) return 'Requesting permission...';
    if (isRequested && isGranted) return 'Permission granted!';
    if (isRequested && !isGranted) return 'Permission denied';
    return '';
  };

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
              <Icon className="h-8 w-8 text-blue-600" />
            </div>
            {getStatusIcon() && (
              <div className="ml-2">
                {getStatusIcon()}
              </div>
            )}
          </div>
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">{explanation}</p>
          </div>

          {getStatusText() && (
            <div className="text-center">
              <p className="text-sm font-medium">{getStatusText()}</p>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {!isRequested && (
              <>
                <Button
                  onClick={onRequest}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Requesting...
                    </>
                  ) : (
                    `Allow ${type === 'sms' ? 'SMS' : 'Notifications'}`
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={onSkip}
                  disabled={isLoading}
                  className="w-full"
                >
                  Skip for now
                </Button>
              </>
            )}
            {isRequested && (
              <Button
                onClick={onSkip}
                className="w-full"
              >
                Continue
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default PermissionStep;
