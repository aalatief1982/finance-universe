
import React from 'react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/formatters';
import { motion } from 'framer-motion';
import { Calendar, Tag } from 'lucide-react';

interface ExpenseCardProps {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  onClick?: () => void;
  className?: string;
}

const ExpenseCard = ({
  id,
  title,
  amount,
  category,
  date,
  onClick,
  className,
}: ExpenseCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "p-4 rounded-lg bg-card border border-border shadow-sm hover:shadow-md transition-all cursor-pointer hover-scale",
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h3 className="font-medium text-base text-card-foreground">{title}</h3>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar size={12} />
              {date}
            </span>
            <span className="flex items-center gap-1">
              <Tag size={12} />
              {category}
            </span>
          </div>
        </div>
        <p className={cn(
          "text-lg font-medium",
          amount < 0 ? "text-red-500" : "text-green-500"
        )}>
          {formatCurrency(amount)}
        </p>
      </div>
    </motion.div>
  );
};

export default ExpenseCard;
