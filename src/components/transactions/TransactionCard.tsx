
		import React from 'react';
		import { motion } from 'framer-motion';
import { Edit, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/utils/format-utils';
import CategoryIcon from '@/components/CategoryIcon';
import { Transaction } from '@/types/transaction';
import { CATEGORY_ICON_MAP } from '@/constants/categoryIconMap';
import { TYPE_ICON_MAP } from '@/constants/typeIconMap';
		import { Card, CardContent } from '@/components/ui/card';
		import { Button } from '@/components/ui/button';
		import { cn } from '@/lib/utils';
		import { format } from 'date-fns';
import { UnconvertedBadge } from '@/components/fx';
import { useLanguage } from '@/i18n/LanguageContext';

		interface TransactionCardProps {
		  transaction: Transaction;
		  onEdit?: () => void;
		  onDelete?: () => void;
		  showActions?: boolean;
		  className?: string;
		}

  const TransactionCard: React.FC<TransactionCardProps> = ({
    transaction, onEdit, onDelete, showActions = true, className,
  }) => {
  const { t } = useLanguage();
  const isIncome = transaction.amount > 0;
		  
  const formatTime = (dateStr: string) => {
        try { return format(new Date(dateStr), 'h:mm a'); }
        catch { return ''; }
  };

  const iconInfo = CATEGORY_ICON_MAP[transaction.category] || CATEGORY_ICON_MAP['Other'];
  const Icon = iconInfo.icon;
  const typeInfo = TYPE_ICON_MAP[transaction.type];
		  
		  return (
			<motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }} className={className}>
                          <Card className="overflow-hidden border rounded-2xl shadow-sm transition-all duration-200">
                                <CardContent className="p-[var(--card-padding)]">
				  <div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
                                          <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', iconInfo.background)}>
                                            <Icon className={iconInfo.color} size={20} />
                                          </div>
					  
					  <div className="space-y-1">
						<h3 className="font-medium text-sm line-clamp-1">{transaction.title}</h3>
                                                <div className="flex items-center text-xs text-muted-foreground">
                                                  <span className="flex items-center gap-1">
                                                    <CategoryIcon category={transaction.category} size={24} />
                                                    {transaction.category}
                                                  </span>
                                                  <span className="mx-1">•</span>
                                                  <span>{formatTime(transaction.date)}</span>
                                                </div>
					  </div>
					</div>
					
                                        <div className="text-right rtl:text-left">
                                          <span className={cn('font-medium', typeInfo.color)}>
                                                {isIncome ? '+' : '-'}
                                                {formatCurrency(Math.abs(transaction.amount), transaction.currency)}
                                          </span>
                                          {transaction.baseCurrency && 
                                           transaction.currency?.toUpperCase() !== transaction.baseCurrency?.toUpperCase() && (
                                            <div className="mt-0.5">
                                              {transaction.amountInBase !== null && transaction.amountInBase !== undefined ? (
                                                <span className="text-xs text-muted-foreground">
                                                  ≈ {formatCurrency(Math.abs(transaction.amountInBase), transaction.baseCurrency)}
                                                </span>
                                              ) : (
                                                <UnconvertedBadge fromCurrency={transaction.currency} toCurrency={transaction.baseCurrency} size="sm" />
                                              )}
                                            </div>
                                          )}
                                        </div>
				  </div>
				  
				  {showActions && (
					<div className="flex justify-end mt-3 gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
					  {onEdit && (
						<Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onEdit(); }} className="h-8 px-2">
						  <Edit size={14} className="ltr:mr-1 rtl:ml-1" />
						  {t('txCard.edit')}
						</Button>
					  )}
					  
					  {onDelete && (
						<Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onDelete(); }} className="h-8 px-2 text-destructive hover:text-destructive/80 hover:bg-destructive/10">
						  <Trash2 size={14} className="ltr:mr-1 rtl:ml-1" />
						  {t('txCard.delete')}
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
