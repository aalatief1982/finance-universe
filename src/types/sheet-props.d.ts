
declare module '@/components/ui/sheet' {
  import * as React from 'react';

  export interface SheetContentProps extends React.HTMLAttributes<HTMLDivElement> {
    side?: 'top' | 'right' | 'bottom' | 'left';
    className?: string;
    children?: React.ReactNode;
    asChild?: boolean;
  }

  export const Sheet: React.FC<React.HTMLAttributes<HTMLDivElement>>;
  export const SheetContent: React.ForwardRefExoticComponent<
    SheetContentProps & React.RefAttributes<React.ElementRef<any>>
  >;
  export const SheetHeader: React.FC<React.HTMLAttributes<HTMLDivElement>>;
  export const SheetTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>>;
  export const SheetTrigger: React.FC<React.HTMLAttributes<HTMLButtonElement>>;
  export const SheetClose: React.FC<React.HTMLAttributes<HTMLButtonElement>>;
}
