
		import React from 'react';
		import { motion } from 'framer-motion';
import {
  Edit,
  Trash2,
  Receipt,
  GraduationCap,
  Gamepad2,
  Utensils,
  Gift,
  HeartPulse,
  Home,
  Baby,
  Bath,
  ConciergeBell,
  ShoppingBag,
  ArrowLeftRight,
  Car,
  Plane,
  Lightbulb,
  CircleDollarSign,
  Package,
  LucideIcon,
} from 'lucide-react';
import { CATEGORY_COLOR_MAP } from '@/constants/categoryColors';
import { formatCurrency } from '@/utils/format-utils';
		import { Transaction } from '@/types/transaction';
		import { Card, CardContent } from '@/components/ui/card';
		import { Button } from '@/components/ui/button';
		import { cn } from '@/lib/utils';
		import { format } from 'date-fns';

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

    const iconMap: Record<string, LucideIcon> = {
      Bills: Receipt,
      Education: GraduationCap,
      Entertainment: Gamepad2,
      Food: Utensils,
      'Gifts & Donations': Gift,
      Health: HeartPulse,
      Housing: Home,
      Kids: Baby,
      'Personal Care': Bath,
      Services: ConciergeBell,
      Shopping: ShoppingBag,
      Transfer: ArrowLeftRight,
      Transportation: Car,
      Travel: Plane,
      Utilities: Lightbulb,
      Income: CircleDollarSign,
      Other: Package,
    };
		  
		  // Get emoji based on category
		  const getEmojiForCategory = (category: string) => {
			const categoryMap: { [key: string]: string } = {
			  'food': '🍔',
			  'restaurant': '🍔',
			  'dining': '🍔',
			  'transportation': '🚕',
			  'housing': '🏠',
			  'rent': '🏠',
			  'utilities': '💡',
			  'groceries': '🛒',
			  'shopping': '🛍️',
			  'entertainment': '🎬',
			  'health': '⚕️',
			  'insurance': '🏥',
			  'education': '📚',
			  'personal': '👤',
			  'travel': '✈️',
			  'salary': '💼',
			  'income': '💰',
			  'investment': '📈'
			};
			
			// Convert category to lowercase and look for matches
			const lowerCategory = category.toLowerCase();
			for (const [key, emoji] of Object.entries(categoryMap)) {
			  if (lowerCategory.includes(key)) {
				return emoji;
			  }
			}
			
			// Default emoji if no match found
			return isIncome ? '💰' : '📝';
		  };
		  
		  // Format time from date
		  const formatTime = (dateStr: string) => {
			try {
			  return format(new Date(dateStr), 'h:mm a');
			} catch (error) {
			  return '';
			}
		  };
		  
		  return (
			<motion.div
			  whileHover={{ y: -2 }}
			  transition={{ duration: 0.2 }}
			  className={className}
			>
                          <Card className="overflow-hidden border rounded-2xl shadow-sm transition-all duration-200">
                                <CardContent className="p-[var(--card-padding)]">
				  <div className="flex items-center justify-between">
					<div className="flex items-center space-x-3">
					  <div className={cn(
						"w-10 h-10 rounded-full flex items-center justify-center",
						isIncome ? "income-bg" : "expense-bg"
					  )}>
						<span className="text-base">
						  {getEmojiForCategory(transaction.category)}
						</span>
					  </div>
					  
					  <div className="space-y-1">
						<h3 className="font-medium text-sm line-clamp-1">{transaction.title}</h3>
                                                <div className="flex items-center text-xs text-muted-foreground">
                                                  <span className="flex items-center gap-1">
                                                    {(() => {
                                                      const Icon = iconMap[transaction.category] || iconMap['Other'];
                                                      const color = CATEGORY_COLOR_MAP[transaction.category] || CATEGORY_COLOR_MAP['Other'];
                                                      return <Icon className={cn('w-6 h-6', color)} />;
                                                    })()}
                                                    {transaction.category}
                                                  </span>
                                                  <span className="mx-1">•</span>
                                                  <span>{formatTime(transaction.date)}</span>
                                                </div>
					  </div>
					</div>
					
					<div className="text-right">
					  <span className={cn(
						"font-medium",
						isIncome ? "income-text" : "expense-text"
					  )}>
						{isIncome ? "+" : "-"}
                                                {formatCurrency(Math.abs(transaction.amount), transaction.currency || 'USD')}
					  </span>
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
