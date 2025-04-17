
import * as React from 'react';

// Common prop for asChild pattern used in Radix components
export interface AsChildProp {
  asChild?: boolean;
}

// Component props that accept children
export interface WithChildren {
  children?: React.ReactNode;
}

// Extended component props
export interface RadixComponentProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
  asChild?: boolean;
}

// Dialog component props
export interface DialogTriggerProps extends RadixComponentProps {}
export interface DialogCloseProps extends RadixComponentProps {}

// Dropdown menu props
export interface DropdownMenuTriggerProps extends RadixComponentProps {}
export interface DropdownMenuItemProps extends RadixComponentProps {
  onClick?: () => void; // Add onClick handler
}

// Accordion props
export interface AccordionProps extends RadixComponentProps {
  type?: "single" | "multiple";
}
export interface AccordionItemProps extends RadixComponentProps {
  value: string;
}
export interface AccordionTriggerProps extends RadixComponentProps {}
export interface AccordionContentProps extends RadixComponentProps {}

// ScrollArea props
export interface ScrollAreaProps extends RadixComponentProps {
  style?: React.CSSProperties;
}

// Popover props
export interface PopoverTriggerProps extends RadixComponentProps {}

// AlertDialog props
export interface AlertDialogTriggerProps extends RadixComponentProps {}

// Progress props
export interface ProgressProps extends RadixComponentProps {
  value?: number;
  max?: number;
  indicatorClassName?: string;
  "aria-valuemin"?: number;
  "aria-valuemax"?: number;
  "aria-valuenow"?: number;
  "aria-label"?: string;
}

// Select props
export interface SelectTriggerProps extends RadixComponentProps {
  id?: string;
}
