import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { getFriendlyMessage } from '@/utils/errorMapper';
import { safeStorage } from '@/utils/safe-storage';
import { ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';

const LAST_ERROR_KEY = 'xpensia_last_error';

interface ErrorBoundaryProps {
  children: ReactNode;
  name?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  showDetails: boolean;
}

interface StoredError {
  route: string;
  boundaryName: string;
  message: string;
  stack?: string;
  timestamp: string;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, showDetails: false };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // ALWAYS log errors in production for traceability
    console.error(`[ErrorBoundary:${this.props.name || 'unknown'}]`, error.message);
    console.error('[ErrorBoundary] Stack:', error.stack);
    console.error('[ErrorBoundary] Component Stack:', info.componentStack);

    // Store last error for debugging
    try {
      const storedError: StoredError = {
        route: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
        boundaryName: this.props.name || 'unknown',
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      };
      safeStorage.setItem(LAST_ERROR_KEY, JSON.stringify(storedError));
    } catch {
      // Ignore storage errors
    }
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null, showDetails: false });
  };

  toggleDetails = (): void => {
    this.setState(prev => ({ showDetails: !prev.showDetails }));
  };

  render() {
    if (this.state.hasError) {
      const friendlyMessage = this.state.error 
        ? getFriendlyMessage(this.state.error) 
        : 'Something went wrong.';
      
      return (
        <div className="p-4 text-center space-y-3 border border-destructive/20 rounded-lg bg-destructive/5 m-2">
          <div className="flex items-center justify-center gap-2 text-destructive">
            <AlertTriangle size={20} />
            <p className="font-medium">{friendlyMessage}</p>
          </div>
          
          <div className="flex justify-center gap-2">
            <Button variant="outline" onClick={this.handleRetry}>
              Retry
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={this.toggleDetails}
              className="text-muted-foreground"
            >
              {this.state.showDetails ? (
                <>Hide Details <ChevronUp size={14} /></>
              ) : (
                <>Show Details <ChevronDown size={14} /></>
              )}
            </Button>
          </div>

          {this.state.showDetails && this.state.error && (
            <div className="mt-3 p-3 bg-muted rounded text-left text-xs font-mono overflow-auto max-h-40">
              <p className="font-semibold text-destructive mb-1">
                {this.state.error.name}: {this.state.error.message}
              </p>
              {this.state.error.stack && (
                <pre className="whitespace-pre-wrap text-muted-foreground">
                  {this.state.error.stack.split('\n').slice(1, 6).join('\n')}
                </pre>
              )}
            </div>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;

// Helper to get last stored error (for debug UI)
export function getLastStoredError(): StoredError | null {
  try {
    const raw = safeStorage.getItem(LAST_ERROR_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// Helper to clear stored error
export function clearStoredError(): void {
  safeStorage.removeItem(LAST_ERROR_KEY);
}
