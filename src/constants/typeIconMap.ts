import {
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeftRight,
  LucideIcon
} from 'lucide-react';

export interface TypeIconInfo {
  icon: LucideIcon;
  color: string;
  background: string;
}

export const TYPE_ICON_MAP: Record<'income' | 'expense' | 'transfer', TypeIconInfo> = {
  income: {
    icon: ArrowUpRight,
    color: 'text-success',
    background: 'bg-success/10'
  },
  expense: {
    icon: ArrowDownRight,
    color: 'text-destructive',
    background: 'bg-destructive/10'
  },
  transfer: {
    icon: ArrowLeftRight,
    color: 'text-info',
    background: 'bg-info/10'
  }
};

