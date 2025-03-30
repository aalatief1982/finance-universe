
import React from 'react';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import { Transaction } from '@/types/transaction';
import TransactionCard from './TransactionCard';
import { motion } from 'framer-motion';

interface TransactionsByDateProps {
  transactions: Transaction[];
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (id: string) => void;
}

const TransactionsByDate: React.FC<TransactionsByDateProps> = ({
  transactions,
  onEdit,
  onDelete
}) => {
  // Group transactions by date
  const groupedTransactions = React.useMemo(() => {
    const groups: { [key: string]: Transaction[] } = {};
    
    transactions.forEach((transaction) => {
      try {
        const date = new Date(transaction.date);
        let dateKey = format(date, 'yyyy-MM-dd');
        
        if (!groups[dateKey]) {
          groups[dateKey] = [];
        }
        
        groups[dateKey].push(transaction);
      } catch (error) {
        console.error('Invalid date in transaction:', transaction);
      }
    });
    
    // Sort each group by time
    Object.keys(groups).forEach((key) => {
      groups[key].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    });
    
    return groups;
  }, [transactions]);
  
  // Format date for display
  const formatDateForDisplay = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      
      if (isToday(date)) {
        return 'Today';
      } else if (isYesterday(date)) {
        return 'Yesterday';
      } else {
        return format(date, 'MMMM d');
      }
    } catch (error) {
      return dateStr;
    }
  };
  
  // Sort the dates (keys) in descending order
  const sortedDates = Object.keys(groupedTransactions).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {sortedDates.map((dateKey) => (
        <div key={dateKey} className="space-y-2">
          <h2 className="text-base font-medium">
            {formatDateForDisplay(dateKey)}
          </h2>
          
          <motion.div className="space-y-3" variants={containerVariants}>
            {groupedTransactions[dateKey].map((transaction) => (
              <motion.div 
                key={transaction.id} 
                variants={itemVariants}
                transition={{ duration: 0.2 }}
              >
                <TransactionCard 
                  transaction={transaction}
                  showActions={false}
                  className="cursor-pointer hover:shadow-md"
                  onEdit={onEdit ? () => onEdit(transaction) : undefined}
                  onDelete={onDelete ? () => onDelete(transaction.id) : undefined}
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      ))}
    </motion.div>
  );
};

export default TransactionsByDate;
