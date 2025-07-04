import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { XpensiaLogo } from '@/components/header/XpensiaLogo';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';

interface ErrorPageProps {
  title: string;
  description: string;
  errorCode?: string;
  showRetry?: boolean;
  showHome?: boolean;
}

const BrandErrorPage: React.FC<ErrorPageProps> = ({
  title,
  description,
  errorCode,
  showRetry = true,
  showHome = true
}) => {
  const navigate = useNavigate();

  const handleRetry = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardContent className="pt-6 space-y-6">
          {/* Brand Logo */}
          <div className="flex justify-center">
            <XpensiaLogo className="h-16 w-16" />
          </div>

          {/* Error Icon */}
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
          </div>

          {/* Error Code */}
          {errorCode && (
            <div className="text-4xl font-bold text-muted-foreground">
              {errorCode}
            </div>
          )}

          {/* Title and Description */}
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-foreground">
              {title}
            </h1>
            <p className="text-muted-foreground">
              {description}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {showRetry && (
              <Button onClick={handleRetry} variant="default">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            )}
            {showHome && (
              <Button onClick={handleGoHome} variant="outline">
                <Home className="h-4 w-4 mr-2" />
                Go Home
              </Button>
            )}
          </div>

          {/* Brand Footer */}
          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              Need help? Contact our support team
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Pre-configured error pages
export const NotFoundPage: React.FC = () => (
  <BrandErrorPage
    errorCode="404"
    title="Page Not Found"
    description="The page you're looking for doesn't exist or has been moved."
  />
);

export const ServerErrorPage: React.FC = () => (
  <BrandErrorPage
    errorCode="500"
    title="Server Error"
    description="Something went wrong on our end. Please try again in a few moments."
  />
);

export const NetworkErrorPage: React.FC = () => (
  <BrandErrorPage
    title="Connection Problem"
    description="Please check your internet connection and try again."
    showHome={false}
  />
);

export const MaintenancePage: React.FC = () => (
  <BrandErrorPage
    title="Under Maintenance"
    description="We're making improvements to serve you better. Please check back soon."
    showRetry={false}
  />
);

export default BrandErrorPage;