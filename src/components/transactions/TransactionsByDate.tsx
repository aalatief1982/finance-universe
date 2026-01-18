import React, { useState } from "react";
import { format, parseISO } from "date-fns";
import { Trash2 } from "lucide-react";
import { Transaction } from "@/types/transaction";
import { formatCurrency } from "@/utils/format-utils";
import CategoryIcon from "../CategoryIcon";
import { CATEGORY_ICON_MAP } from "@/constants/categoryIconMap";
import { TYPE_ICON_MAP } from "@/constants/typeIconMap";
import { Button } from "@/components/ui/button";
import { 
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTransactions } from "@/context/TransactionContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface TransactionsByDateProps {
  transactions: Transaction[];
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (id: string) => void;
}

const TransactionsByDate: React.FC<TransactionsByDateProps> = ({
  transactions,
}) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const { deleteTransaction } = useTransactions();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Group transactions by date
  const groupedTransactions = transactions.reduce(
    (groups, transaction) => {
      const date = transaction.date.split("T")[0]; // Get YYYY-MM-DD part
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(transaction);
      return groups;
    },
    {} as Record<string, Transaction[]>,
  );

  // Sort dates in descending order
  const sortedDates = Object.keys(groupedTransactions).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime(),
  );

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "EEE, MMM d");
    } catch (e) {
      // Fallback for any date parsing issues
      return dateString;
    }
  };

  const handleTransactionClick = (transaction: Transaction) => {
    navigate(`/edit-transaction/${transaction.id}`, { state: { transaction } });
  };

  const handleDeleteClick = (e: React.MouseEvent, transaction: Transaction) => {
    e.stopPropagation();
    setTransactionToDelete(transaction);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (transactionToDelete) {
      deleteTransaction(transactionToDelete.id);
      toast({
        description: "Transaction deleted successfully"
      });
      setDeleteDialogOpen(false);
      setTransactionToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setTransactionToDelete(null);
  };


  return (
    <>
      <div className="space-y-[var(--card-gap)] px-[var(--page-padding-x)]">
        {sortedDates.map((date) => {
          // Exclude transfers from daily net calculation
          const net = groupedTransactions[date]
            .filter(t => t.type !== 'transfer')
            .reduce((s, t) => s + t.amount, 0);
          const netCurrency = groupedTransactions[date][0]?.currency || 'USD';
          return (
            <div key={date} className="space-y-[var(--card-gap)]">
              <h3 className="font-semibold text-card-foreground dark:text-white text-sm">
                {formatDate(date)}
              </h3>

              <div className="space-y-[var(--card-gap)]">
                {groupedTransactions[date].map((transaction, index) => {
                  if (!transaction.id?.trim()) {
                    if (import.meta.env.MODE === 'development') console.warn(
                      "⚠️ Empty or invalid transaction.id:",
                      transaction,
                    );
                  }

                  return (
                    <div
                      key={transaction.id?.trim() || `txn-${date}-${index}`}
                      className="bg-card text-card-foreground dark:bg-black dark:text-white rounded-2xl shadow-sm border px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleTransactionClick(transaction)}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 min-w-0">
                          <CategoryIcon category={transaction.category} size={40} />
                          {(() => {
                            const TypeIcon = TYPE_ICON_MAP[transaction.type].icon;
                            return (
                              <TypeIcon
                                className={`w-4 h-4 ${TYPE_ICON_MAP[transaction.type].color}`}
                              />
                            );
                          })()}
                          <div className="min-w-0">
                            <h4 className="font-medium text-sm line-clamp-1">
                              {transaction.title}
                            </h4>
                            <span className="text-xs text-muted-foreground">
                              {transaction.type === 'transfer' 
                                ? `${transaction.fromAccount} → ${transaction.toAccount}`
                                : transaction.category}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <span
                            className={`font-semibold ${
                              transaction.amount < 0
                                ? "text-red-600"
                                : "text-green-600"
                            }`}
                          >
                            {formatCurrency(transaction.amount)}
                          </span>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={(e) => handleDeleteClick(e, transaction)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete transaction</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div
                className={`text-center text-sm font-semibold ${
                  net >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                Net: {formatCurrency(net, netCurrency)}
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure you want to delete this transaction?</DialogTitle>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelDelete}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TransactionsByDate;
