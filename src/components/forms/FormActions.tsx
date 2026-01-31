/**
 * @file FormActions.tsx
 * @description UI component for FormActions.
 *
 * @module components/forms/FormActions
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
import { Button } from '@/components/ui/button';

interface FormActionsProps {
  onCancel?: () => void;
  isUpdate?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  isSubmitting?: boolean;
}

const FormActions: React.FC<FormActionsProps> = ({
  onCancel,
  isUpdate = false,
  submitLabel,
  cancelLabel = "Cancel",
  isSubmitting = false
}) => {
  // Default submit label based on whether it's an update
  const defaultSubmitLabel = isUpdate ? "Update" : "Add";
  const finalSubmitLabel = submitLabel || `${defaultSubmitLabel} Transaction`;

  return (
    <div className="flex justify-end space-x-2 pt-2">
      {onCancel && (
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          {cancelLabel}
        </Button>
      )}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Processing..." : finalSubmitLabel}
      </Button>
    </div>
  );
};

export default FormActions;
