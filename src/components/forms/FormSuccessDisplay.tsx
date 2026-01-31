/**
 * @file FormSuccessDisplay.tsx
 * @description UI component for FormSuccessDisplay.
 *
 * @module components/forms/FormSuccessDisplay
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
import { CheckCircle } from 'lucide-react';

interface FormSuccessDisplayProps {
  message: string;
}

const FormSuccessDisplay: React.FC<FormSuccessDisplayProps> = ({ message }) => {
  return (
    <Alert className="mb-4 border-success bg-success/10">
      <CheckCircle className="h-4 w-4 text-success" />
      <AlertDescription className="text-success">{message}</AlertDescription>
    </Alert>
  );
};

export default FormSuccessDisplay;