
/**
 * @file TransactionGrid.tsx
 * @description Animated list of transaction cards with edit and delete actions.
 *
 * @responsibilities
 * - Render transaction cards with consistent formatting
 * - Provide edit and delete affordances with confirmation
 * - Display hover controls for item actions
 *
 * @dependencies
 * - ExpenseCard: transaction card display
 * - AlertDialog: confirmation dialog for deletes
 *
 * @review-tags
 * - @risk: delete action must require confirmation
 * - @usability: hover-only controls should remain discoverable
 *
 * @review-checklist
 * - [ ] Delete action always uses AlertDialog confirmation
 * - [ ] onEditTransaction is triggered from card click and edit button
 */
import React from 'react';
import { motion } from 'framer-motion';
import { Trash2, Edit, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import ExpenseCard from '@/components/ExpenseCard';
import { Transaction } from '@/types/transaction';
import { formatDate } from '@/lib/formatters';

interface TransactionGridProps {
  transactions: Transaction[];
  onEditTransaction: (transaction: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
}

const TransactionGrid: React.FC<TransactionGridProps> = ({
  transactions,
  onEditTransaction,
  onDeleteTransaction
}) => {
  const { toast } = useToast();
  // ============================================================================
  // SECTION: Animation Variants
  // PURPOSE: Provide consistent enter animations for list + items
  // REVIEW: Stagger timing should not hinder list performance
  // ============================================================================

  // Animation variants for the container
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  // Animation variants for each item
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        type: "spring" as const, 
        stiffness: 100 
      }
    }
  };

  return (
    <motion.div 
      className="space-y-3"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {transactions.map((transaction, idx) => (
        <motion.div
          key={transaction.id || idx}
          variants={itemVariants}
          className="group transition-all duration-300"
        >
          <div className="flex items-center gap-3 relative">
            <div className="flex-1" onClick={() => onEditTransaction(transaction)}>
              <ExpenseCard
                id={transaction.id}
                title={transaction.title}
                amount={transaction.amount}
                category={transaction.category}
                date={formatDate(transaction.date)}
              />
            </div>
            
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-muted-foreground hover:text-primary"
                onClick={() => onEditTransaction(transaction)}
              >
                <Edit size={16} />
              </Button>
              
              {/* Delete confirmation dialog */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                    <Trash2 size={16} />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete transaction</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{transaction.title}"? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={() => {
                        onDeleteTransaction(transaction.id);
                        toast({ description: 'Transaction deleted successfully' });
                      }}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default TransactionGrid;
