/**
 * @file FormErrorDisplay.tsx
 * @description UI component for FormErrorDisplay.
 *
 * @module components/forms/FormErrorDisplay
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
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface FormErrorDisplayProps {
  error: string;
}

const FormErrorDisplay: React.FC<FormErrorDisplayProps> = ({ error }) => {
  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  );
};

export default FormErrorDisplay;