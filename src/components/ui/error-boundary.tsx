import React, { Component, ErrorInfo, ReactNode } from "react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton"; 
import { RefreshCw, AlertTriangle, Info } from "lucide-react";
import { handleError } from "@/utils/error-utils";
import { ErrorType, ErrorSeverity } from "@/types/error";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  name?: string; // Component name for better error tracking
  fallbackType?: "alert" | "skeleton" | "minimal";
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Update state with error info for display
    this.setState({
      errorInfo
    });
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    
    // Use our global error handler
    handleError({
      type: ErrorType.UNKNOWN,
      message: `Error in ${this.props.name || 'component'}: ${error.message}`,
      severity: ErrorSeverity.ERROR,
      details: { 
        componentStack: errorInfo.componentStack,
        componentName: this.props.name
      },
      originalError: error
    });
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  renderDefaultFallback() {
    const { error, errorInfo } = this.state;
    
    switch(this.props.fallbackType) {
      case "skeleton":
        return (
          <div className="space-y-2 my-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-8 w-1/2" />
            <div className="flex justify-center mt-4">
              <Button 
                variant="outline" 
                onClick={this.handleReset}
                className="flex items-center gap-2"
              >
                <RefreshCw size={16} />
                Retry
              </Button>
            </div>
          </div>
        );
      
      case "minimal":
        return (
          <div className="p-4 border border-gray-200 rounded-md bg-gray-50 text-gray-500 my-2">
            <div className="flex items-center gap-2 text-sm mb-2">
              <Info size={16} />
              <span>This component couldn't be loaded</span>
            </div>
            <Button 
              variant="ghost" 
              onClick={this.handleReset} 
              size="sm"
              className="flex items-center gap-1.5 h-8 text-xs"
            >
              <RefreshCw size={12} />
              Retry
            </Button>
          </div>
        );
      
      case "alert":
      default:
        return (
          <Alert className="my-4" variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error: {this.props.name || 'Component'} failed to load</AlertTitle>
            <AlertDescription className="space-y-4">
              <p>
                {error?.message || 'An unexpected error occurred. You can try reloading this component.'}
              </p>
              {process.env.NODE_ENV === 'development' && errorInfo && (
                <div className="mt-2 max-h-32 overflow-auto text-xs p-2 bg-gray-800 text-gray-200 rounded">
                  <pre>{errorInfo.componentStack}</pre>
                </div>
              )}
              <Button 
                variant="outline" 
                onClick={this.handleReset}
                className="flex items-center gap-2"
              >
                <RefreshCw size={16} />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        );
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      // Otherwise use appropriate default fallback
      return this.renderDefaultFallback();
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
