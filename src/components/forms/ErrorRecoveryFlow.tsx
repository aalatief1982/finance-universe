import React, { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RotateCcw, FileText, HelpCircle } from 'lucide-react';
import { getBrandMessage } from '@/constants/brandGuidelines';

interface ErrorRecoveryFlowProps {
  error: Error;
  onRetry?: () => void;
  onReset?: () => void;
  onReportIssue?: (details: string) => void;
  context?: string;
  suggestions?: string[];
}

const ErrorRecoveryFlow: React.FC<ErrorRecoveryFlowProps> = ({
  error,
  onRetry,
  onReset,
  onReportIssue,
  context,
  suggestions = []
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [reportDetails, setReportDetails] = useState('');

  const getErrorSuggestions = (errorMessage: string) => {
    if (suggestions.length > 0) return suggestions;
    
    const defaultSuggestions = [];
    
    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      defaultSuggestions.push('Check your internet connection');
      defaultSuggestions.push('Try refreshing the page');
    }
    
    if (errorMessage.includes('permission')) {
      defaultSuggestions.push('Grant the required permissions');
      defaultSuggestions.push('Check your browser settings');
    }
    
    if (errorMessage.includes('validation') || errorMessage.includes('invalid')) {
      defaultSuggestions.push('Check your input values');
      defaultSuggestions.push('Ensure all required fields are filled');
    }
    
    return defaultSuggestions.length > 0 ? defaultSuggestions : [
      'Try refreshing the page',
      'Clear your browser cache',
      'Contact support if the issue persists'
    ];
  };

  const errorSuggestions = getErrorSuggestions(error.message);

  return (
    <Card className="w-full border-destructive/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle size={20} />
          Something went wrong
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="destructive">
          <AlertDescription>
            {getBrandMessage('errorMessages', 'validation')}
          </AlertDescription>
        </Alert>

        {context && (
          <div className="text-sm text-muted-foreground">
            <strong>Context:</strong> {context}
          </div>
        )}

        <div className="space-y-2">
          <h4 className="text-sm font-medium">Suggested solutions:</h4>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {errorSuggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-muted-foreground">•</span>
                {suggestion}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-wrap gap-2">
          {onRetry && (
            <Button
              variant="default"
              size="sm"
              onClick={onRetry}
              className="gap-1"
            >
              <RotateCcw size={14} />
              Try Again
            </Button>
          )}
          
          {onReset && (
            <Button
              variant="outline"
              size="sm"
              onClick={onReset}
              className="gap-1"
            >
              <FileText size={14} />
              Start Over
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="gap-1"
          >
            <HelpCircle size={14} />
            {showDetails ? 'Hide' : 'Show'} Details
          </Button>
        </div>

        {showDetails && (
          <div className="space-y-3 pt-3 border-t">
            <div className="bg-muted p-3 rounded-md text-xs font-mono">
              <strong>Error:</strong> {error.message}
              {error.stack && (
                <>
                  <br />
                  <strong>Stack:</strong>
                  <pre className="mt-1 whitespace-pre-wrap text-xs">
                    {error.stack}
                  </pre>
                </>
              )}
            </div>
            
            {onReportIssue && (
              <div className="space-y-2">
                <textarea
                  placeholder="Describe what you were trying to do when this error occurred..."
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  className="w-full p-2 text-sm border rounded-md bg-background"
                  rows={3}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onReportIssue(reportDetails)}
                  disabled={!reportDetails.trim()}
                >
                  Report Issue
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ErrorRecoveryFlow;