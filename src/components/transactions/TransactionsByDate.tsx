import React, { useState } from "react";
import { format, parseISO } from "date-fns";
import { Trash2 } from "lucide-react";
import { Transaction } from "@/types/transaction";
import { formatCurrency } from "@/utils/format-utils";
import { getUserSettings } from "@/utils/storage-utils";
import CategoryIcon from "../CategoryIcon";
import { TYPE_ICON_MAP } from "@/constants/typeIconMap";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTransactions } from "@/context/TransactionContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { normalizeInferenceDTO } from "@/lib/inference/inferenceDTO";
import { UnconvertedBadge } from "@/components/fx";
import { useLanguage } from "@/i18n/LanguageContext";

interface TransactionsByDateProps {
  transactions: Transaction[];
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (id: string) => void;
}

const TransactionsByDate: React.FC<TransactionsByDateProps> = ({ transactions }) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const { deleteTransaction } = useTransactions();
  const { toast } = useToast();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const userCurrency = getUserSettings().currency || 'USD';

  const groupedTransactions = transactions.reduce(
    (groups, transaction) => {
      const date = transaction.date.split("T")[0];
      if (!groups[date]) groups[date] = [];
      groups[date].push(transaction);
      return groups;
    },
    {} as Record<string, Transaction[]>,
  );

  const sortedDates = Object.keys(groupedTransactions).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime(),
  );

  const formatDate = (dateString: string) => {
    try { return format(parseISO(dateString), "EEE, MMM d"); }
    catch { return dateString; }
  };

  const handleTransactionClick = (transaction: Transaction) => {
    navigate(`/edit-transaction/${transaction.id}`, { state: normalizeInferenceDTO({ transaction, mode: 'edit', isSuggested: false }) });
  };

  const handleDeleteClick = (e: React.MouseEvent, transaction: Transaction) => {
    e.stopPropagation();
    setTransactionToDelete(transaction);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (transactionToDelete) {
      deleteTransaction(transactionToDelete.id);
      toast({ description: t('transaction.deletedSuccessfully') });
      setDeleteDialogOpen(false);
      setTransactionToDelete(null);
    }
  };

  return (
    <>
      <div className="space-y-[var(--card-gap)] px-[var(--page-padding-x)]">
        {sortedDates.map((date) => {
          const net = groupedTransactions[date]
            .filter(t => t.type !== 'transfer')
            .reduce((s, t) => s + t.amount, 0);
          const netCurrency = groupedTransactions[date].find(t => !!t.currency)?.currency || userCurrency;
          return (
            <div key={date} className="space-y-[var(--card-gap)]">
              <h3 className="font-semibold text-card-foreground dark:text-white text-sm">{formatDate(date)}</h3>
              <div className="space-y-[var(--card-gap)]">
                {groupedTransactions[date].map((transaction, index) => {
                  if (!transaction.id?.trim() && import.meta.env.MODE === 'development') {
                    console.warn("⚠️ Empty or invalid transaction.id:", transaction);
                  }
                  return (
                    <div
                      key={transaction.id?.trim() || `txn-${date}-${index}`}
                      className="bg-card text-card-foreground dark:bg-black dark:text-white rounded-2xl shadow-sm border px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleTransactionClick(transaction)}
                      onKeyDown={(e) => e.key === 'Enter' && handleTransactionClick(transaction)}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 min-w-0">
                          <CategoryIcon category={transaction.category} size={40} />
                          {(() => {
                            const TypeIcon = TYPE_ICON_MAP[transaction.type].icon;
                            return <TypeIcon className={`w-4 h-4 ${TYPE_ICON_MAP[transaction.type].color}`} />;
                          })()}
                          <div className="min-w-0">
                            <h4 className="font-medium text-sm line-clamp-1">{transaction.title}</h4>
                            <span className="text-xs text-muted-foreground">
                              {transaction.type === 'transfer'
                                ? `${transaction.fromAccount} → ${transaction.toAccount}`
                                : transaction.category}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right rtl:text-left">
                            <span className={`font-semibold ${transaction.amount < 0 ? "text-red-600" : "text-green-600"}`}>
                              {formatCurrency(transaction.amount, transaction.currency || userCurrency)}
                            </span>
                            {transaction.baseCurrency &&
                             transaction.currency?.toUpperCase() !== transaction.baseCurrency?.toUpperCase() && (
                              <div className="mt-0.5">
                                {transaction.amountInBase !== null && transaction.amountInBase !== undefined ? (
                                  <span className="text-xs text-muted-foreground">
                                    ≈ {formatCurrency(transaction.amountInBase, transaction.baseCurrency)}
                                    {transaction.fxRateToBase && (
                                      <span className="ltr:ml-1 rtl:mr-1 opacity-70">@ {transaction.fxRateToBase.toFixed(2)}</span>
                                    )}
                                  </span>
                                ) : (
                                  <UnconvertedBadge fromCurrency={transaction.currency || userCurrency} toCurrency={transaction.baseCurrency} size="sm" />
                                )}
                              </div>
                            )}
                          </div>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={(e) => handleDeleteClick(e, transaction)}>
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">{t('txByDate.deleteTransaction')}</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className={`text-center text-sm font-semibold ${net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {t('txByDate.net')}: {formatCurrency(net, netCurrency)}
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('txByDate.deleteConfirm')}</DialogTitle>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteDialogOpen(false); setTransactionToDelete(null); }}>{t('common.cancel')}</Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>{t('txByDate.ok')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TransactionsByDate;
