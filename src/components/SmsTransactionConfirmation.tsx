import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Transaction } from '@/types/transaction';
import { getCategoryHierarchy } from '@/lib/categories-data';

interface SmsTransactionConfirmationProps {
  transaction: Transaction;
  onConfirm: () => void;
  onEdit: () => void;
  onReject: () => void;
}

const SmsTransactionConfirmation: React.FC<SmsTransactionConfirmationProps> = ({
  transaction,
  onConfirm,
  onEdit,
  onReject,
}) => {
  const category = getCategoryHierarchy().find(cat => cat.name === transaction.category);
  const subcategory = category?.subcategories?.find(sub => sub.name === transaction.subcategory);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Confirm Transaction</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="flex items-center space-x-4">
            <span>Title:</span>
            <Badge>{transaction.title}</Badge>
          </div>
          <div className="flex items-center space-x-4">
            <span>Amount:</span>
            <span>{transaction.amount}</span>
          </div>
          <div className="flex items-center space-x-4">
            <span>Category:</span>
            <span>{transaction.category}</span>
          </div>
          {subcategory && (
            <div className="flex items-center space-x-4">
              <span>Subcategory:</span>
              <span>{subcategory.name}</span>
            </div>
          )}
          <div className="flex items-center space-x-4">
            <span>Date:</span>
            <span>{transaction.date}</span>
          </div>
        </div>
        <div className="flex justify-end space-x-2 mt-4">
          <Button variant="secondary" onClick={onReject}>
            Reject
          </Button>
          <Button variant="outline" onClick={onEdit}>
            Edit
          </Button>
          <Button onClick={onConfirm}>Confirm</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SmsTransactionConfirmation;
