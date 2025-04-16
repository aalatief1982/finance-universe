
declare module '@/components/ui/sheet' {
  import * as React from 'react';

  export interface SheetContentProps extends React.HTMLAttributes<HTMLDivElement> {
    side?: 'top' | 'right' | 'bottom' | 'left';
    className?: string;
    children?: React.ReactNode;
    asChild?: boolean;
  }

  export interface SheetTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    asChild?: boolean;
    children?: React.ReactNode;
  }

  export interface SheetCloseProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    asChild?: boolean;
    children?: React.ReactNode;
  }

  export const Sheet: React.FC<React.HTMLAttributes<HTMLDivElement> & {
    children?: React.ReactNode;
  }>;
  export const SheetContent: React.ForwardRefExoticComponent<
    SheetContentProps & React.RefAttributes<React.ElementRef<any>>
  >;
  export const SheetHeader: React.FC<React.HTMLAttributes<HTMLDivElement> & {
    children?: React.ReactNode;
  }>;
  export const SheetTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement> & {
    children?: React.ReactNode;
  }>;
  export const SheetTrigger: React.FC<SheetTriggerProps>;
  export const SheetClose: React.FC<SheetCloseProps>;
}
