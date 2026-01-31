/**
 * @file ChartErrorBoundary.tsx
 * @description UI component for ChartErrorBoundary.
 *
 * @module components/charts/ChartErrorBoundary
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
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, BarChart3 } from 'lucide-react';
import { safeStorage } from '@/utils/safe-storage';

interface ChartErrorBoundaryProps {
  children: ReactNode;
  chartName: string;
  height?: string;
}

interface ChartErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Specialized error boundary for chart components
 * Provides a graceful fallback that doesn't crash the entire page
 */
class ChartErrorBoundary extends Component<ChartErrorBoundaryProps, ChartErrorBoundaryState> {
  constructor(props: ChartErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ChartErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Always log chart errors
    console.error(`[ChartError:${this.props.chartName}]`, error.message);
    console.error('[ChartError] Stack:', error.stack);
    
    // Store error for debugging
    try {
      const errors = JSON.parse(safeStorage.getItem('xpensia_chart_errors') || '[]');
      errors.unshift({
        chart: this.props.chartName,
        message: error.message,
        timestamp: new Date().toISOString(),
      });
      // Keep only last 5 errors
      safeStorage.setItem('xpensia_chart_errors', JSON.stringify(errors.slice(0, 5)));
    } catch {
      // Ignore
    }
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div 
          className="flex flex-col items-center justify-center text-muted-foreground bg-muted/30 rounded-lg p-4"
          style={{ height: this.props.height || '270px' }}
        >
          <BarChart3 size={32} className="mb-2 opacity-40" />
          <p className="text-sm mb-2">Unable to load {this.props.chartName}</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={this.handleRetry}
            className="h-7 text-xs"
          >
            <RefreshCw size={12} className="mr-1" />
            Retry
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ChartErrorBoundary;
