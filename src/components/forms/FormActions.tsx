
import React from 'react';
import { Button } from '@/components/ui/button';

interface FormActionsProps {
  onCancel?: () => void;
  isUpdate: boolean;
}

const FormActions: React.FC<FormActionsProps> = ({
  onCancel,
  isUpdate
}) => {
  return (
    <div className="flex justify-end space-x-2 pt-2">
      {onCancel && (
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
        >
          Cancel
        </Button>
      )}
      <Button type="submit">
        {isUpdate ? "Update" : "Add"} Transaction
      </Button>
    </div>
  );
};

export default FormActions;
