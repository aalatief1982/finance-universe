
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CATEGORIES } from '@/lib/mock-data';

export interface SmsTransaction {
  id: string;
  message: string;
  sender: string;
  amount: number;
  date: string;
  inferredCategory: string;
  description: string;
}

interface SmsTransactionConfirmationProps {
  transaction: SmsTransaction;
  onConfirm: (transaction: SmsTransaction) => void;
  onDecline: (id: string) => void;
  onEdit: (transaction: SmsTransaction) => void;
}

const SmsTransactionConfirmation: React.FC<SmsTransactionConfirmationProps> = ({
  transaction,
  onConfirm,
  onDecline,
  onEdit
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTransaction, setEditedTransaction] = useState({ ...transaction });

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    onEdit(editedTransaction);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedTransaction({ ...transaction });
    setIsEditing(false);
  };

  const handleChange = (field: keyof SmsTransaction, value: string | number) => {
    setEditedTransaction(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="border rounded-lg p-4 bg-card"
    >
      <div className="space-y-3">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-muted-foreground">From: {transaction.sender}</p>
            <p className="text-sm truncate max-w-[200px]">{transaction.message}</p>
          </div>
          <div className="shrink-0">
            <p className={`font-semibold ${transaction.amount < 0 ? 'text-red-500' : 'text-green-500'}`}>
              ${Math.abs(transaction.amount).toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground text-right">{transaction.date}</p>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm font-medium">Category:</p>
            <p className="text-sm">{transaction.inferredCategory}</p>
          </div>
          <div className="flex space-x-2">
            <Button 
              size="sm" 
              variant="outline" 
              className="p-1 h-8 w-8"
              onClick={handleEdit}
            >
              <Edit size={16} />
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="p-1 h-8 w-8 text-red-500 hover:bg-red-500/10"
              onClick={() => onDecline(transaction.id)}
            >
              <X size={16} />
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              className="p-1 h-8 w-8 text-green-500 hover:bg-green-500/10"
              onClick={() => onConfirm(transaction)}
            >
              <Check size={16} />
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={isEditing} onOpenChange={(open) => !open && handleCancelEdit()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount</label>
              <Input 
                type="number" 
                value={Math.abs(editedTransaction.amount)}
                onChange={(e) => handleChange('amount', Number(e.target.value) * (editedTransaction.amount < 0 ? -1 : 1))}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Select 
                value={editedTransaction.amount < 0 ? "expense" : "income"}
                onValueChange={(value) => {
                  const newAmount = Math.abs(editedTransaction.amount) * (value === "expense" ? -1 : 1);
                  handleChange('amount', newAmount);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select 
                value={editedTransaction.inferredCategory}
                onValueChange={(value) => handleChange('inferredCategory', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input 
                value={editedTransaction.description}
                onChange={(e) => handleChange('description', e.target.value)}
              />
            </div>
            
            <div className="flex justify-end space-x-2 pt-2">
              <Button variant="outline" onClick={handleCancelEdit}>Cancel</Button>
              <Button onClick={handleSaveEdit}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default SmsTransactionConfirmation;
