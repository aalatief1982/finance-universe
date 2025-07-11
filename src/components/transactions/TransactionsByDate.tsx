import React from "react";
import { format, parseISO } from "date-fns";
import { Transaction } from "@/types/transaction";
import { formatCurrency } from "@/utils/format-utils";
import TransactionActions from "./TransactionActions";
import CategoryIcon from "../CategoryIcon";
import { CATEGORY_ICON_MAP } from "@/constants/categoryIconMap";
import { TYPE_ICON_MAP } from "@/constants/typeIconMap";

interface TransactionsByDateProps {
  transactions: Transaction[];
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (id: string) => void;
}

const TransactionsByDate: React.FC<TransactionsByDateProps> = ({
  transactions,
}) => {
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


  return (
    <div className="space-y-[var(--card-gap)] px-[var(--page-padding-x)]">
      {sortedDates.map((date) => {
        const net = groupedTransactions[date].reduce((s, t) => s + t.amount, 0);
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
                    className="bg-card text-card-foreground dark:bg-black dark:text-white rounded-2xl shadow-sm border px-4 py-3"
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
                            {transaction.category}
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

                        <TransactionActions
                          transaction={transaction}
                          variant="dropdown"
                        />
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
  );
};

export default TransactionsByDate;
