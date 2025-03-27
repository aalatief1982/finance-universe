import React from 'react';
import { motion } from 'framer-motion';
import { ArrowDownLeft, ArrowUpRight, Calendar, Tag, Edit, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { formatDate } from '@/lib/formatters';
import { Transaction } from '@/types/transaction';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TransactionCardProps {
  transaction: Transaction;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
  className?: string;
}

const TransactionCard: React.FC<TransactionCardProps> = ({
  transaction,
  onEdit,
  onDelete,
  showActions = true,
  className,
}) => {
  const isIncome = transaction.amount > 0;
  
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className={className}
    >
      <Card className={cn(
        "overflow-hidden border transition-all duration-200",
        isIncome ? "hover:border-green-500/50" : "hover:border-red-500/50"
      )}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center",
                isIncome ? "bg-green-100" : "bg-red-100"
              )}>
                {isIncome ? (
                  <ArrowUpRight className="text-green-600" size={20} />
                ) : (
                  <ArrowDownLeft className="text-red-600" size={20} />
                )}
              </div>
              
              <div className="space-y-1">
                <h3 className="font-medium text-sm line-clamp-1">{transaction.title}</h3>
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <span className="flex items-center">
                    <Calendar size={12} className="mr-1" />
                    {formatDate(transaction.date)}
                  </span>
                  <span className="flex items-center">
                    <Tag size={12} className="mr-1" />
                    {transaction.category}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <span className={cn(
                "font-semibold",
                isIncome ? "text-green-600" : "text-red-600"
              )}>
                {isIncome ? "+" : "-"}
                {formatCurrency(Math.abs(transaction.amount))}
              </span>
              
              {transaction.notes && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                  {transaction.notes}
                </p>
              )}
            </div>
          </div>
          
          {showActions && (
            <div className="flex justify-end mt-3 space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
              {onEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                  className="h-8 px-2"
                >
                  <Edit size={14} className="mr-1" />
                  Edit
                </Button>
              )}
              
              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-100"
                >
                  <Trash2 size={14} className="mr-1" />
                  Delete
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default TransactionCard;
