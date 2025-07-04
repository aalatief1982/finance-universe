
import React, { useRef, useState } from 'react';
import { motion, PanInfo, useAnimation } from 'framer-motion';
import { Trash2, Pen } from 'lucide-react';
import { Transaction } from '@/types/transaction';
import { formatCurrency } from '@/lib/formatters';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useTransactions } from '@/context/TransactionContext';
import { useToast } from '@/components/ui/use-toast';
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface SwipeableTransactionCardProps {
  transaction: Transaction;
}

const SwipeableTransactionCard: React.FC<SwipeableTransactionCardProps> = ({
  transaction
}) => {
  const navigate = useNavigate();
  const { deleteTransaction } = useTransactions();
  const { toast } = useToast();
  const controls = useAnimation();
  const constraintsRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');

  const handleEdit = () => {
    navigate(`/edit-transaction/${transaction.id}`, { state: { transaction } });
  };

  const handleDelete = () => {
    deleteTransaction(transaction.id);
    toast({
      title: "Transaction deleted",
      description: "The transaction has been successfully deleted",
    });
  };

  const handleDragEnd = (e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);
    
    if (info.offset.x < -100) {
      handleDelete();
    } else if (info.offset.x > 100) {
      handleEdit();
    } else {
      controls.start({ x: 0 });
    }
  };

  // Don't use swipe on desktop
  if (!isMobile) {
    return (
      <Card className="p-[var(--card-padding)]">
        <div className="flex justify-between items-center">
          <div>
            <h4 className="font-medium">{transaction.title}</h4>
            <p className="text-sm text-muted-foreground">{transaction.category}</p>
          </div>
          
          <div className="flex items-center gap-4">
            <span className={`text-lg font-medium ${transaction.amount < 0 ? 'text-destructive' : 'text-success'}`}>
              {formatCurrency(transaction.amount)}
            </span>
            
            <div className="flex">
              <button
                onClick={handleEdit}
                className="p-2 text-info hover:bg-info/10 rounded-full"
              >
                <Pen size={16} />
              </button>
              <button
                onClick={handleDelete}
                className="p-2 text-destructive hover:bg-destructive/10 rounded-full"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl mb-2" ref={constraintsRef}>
      {/* Background elements */}
      <div className="absolute inset-0 flex justify-between items-stretch">
        <div className="bg-info w-1/2 flex items-center justify-center">
          <Pen size={24} className="text-white" />
        </div>
        <div className="bg-destructive w-1/2 flex items-center justify-center">
          <Trash2 size={24} className="text-white" />
        </div>
      </div>

      {/* Swipeable Card */}
      <motion.div
        drag="x"
        dragConstraints={constraintsRef}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        animate={controls}
        className="relative bg-card rounded-2xl shadow-sm z-10"
      >
        <Card className="p-[var(--card-padding)] cursor-grab active:cursor-grabbing">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-medium">{transaction.title}</h4>
              <p className="text-sm text-muted-foreground">{transaction.category}</p>
            </div>
            
            <span className={`text-lg font-medium ${transaction.amount < 0 ? 'text-destructive' : 'text-success'}`}>
              {formatCurrency(transaction.amount)}
            </span>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default SwipeableTransactionCard;
