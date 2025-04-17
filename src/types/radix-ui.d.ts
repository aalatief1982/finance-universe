
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
export interface RadixComponentProps extends React.HTMLAttributes<HTMLElement>, WithChildren, AsChildProp {}

// Dialog component props
export interface DialogTriggerProps extends RadixComponentProps {
  asChild?: boolean;
  children?: React.ReactNode;
}
export interface DialogCloseProps extends RadixComponentProps {
  asChild?: boolean;
  children?: React.ReactNode;
}

// Dropdown menu props
export interface DropdownMenuTriggerProps extends RadixComponentProps {
  asChild?: boolean;
  children?: React.ReactNode;
}
export interface DropdownMenuItemProps extends RadixComponentProps {
  asChild?: boolean;
  children?: React.ReactNode;
  onClick?: () => void; // Add onClick handler
}

// Accordion props
export interface AccordionProps extends RadixComponentProps {
  type?: "single" | "multiple";
  children?: React.ReactNode;
}
export interface AccordionItemProps extends RadixComponentProps {
  value: string;
  children?: React.ReactNode;
}
export interface AccordionTriggerProps extends RadixComponentProps {
  children?: React.ReactNode;
}
export interface AccordionContentProps extends RadixComponentProps {
  children?: React.ReactNode;
}

// ScrollArea props
export interface ScrollAreaProps extends RadixComponentProps {
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

// Popover props
export interface PopoverTriggerProps extends RadixComponentProps {
  asChild?: boolean;
  children?: React.ReactNode;
}

// AlertDialog props
export interface AlertDialogTriggerProps extends RadixComponentProps {
  asChild?: boolean;
  children?: React.ReactNode;
}
export interface AlertDialogActionProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  onClick?: () => void;
  children?: React.ReactNode;
}

// Tooltip props
export interface TooltipTriggerProps extends RadixComponentProps {
  asChild?: boolean;
  children?: React.ReactNode;
}

// Switch props
export interface SwitchProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
}

// Progress props
export interface ProgressProps extends RadixComponentProps {
  value?: number;
  max?: number;
  indicatorClassName?: string;
  "aria-valuemin"?: number;
  "aria-valuemax"?: number;
  "aria-valuenow"?: number;
  "aria-label"?: string;
  className?: string;
}

// Select props
export interface SelectTriggerProps extends RadixComponentProps {
  id?: string;
  children?: React.ReactNode;
}

// Collapsible props
export interface CollapsibleProps extends RadixComponentProps {
  open?: boolean;
  children?: React.ReactNode;
}
export interface CollapsibleContentProps extends RadixComponentProps {
  children?: React.ReactNode;
}

// Context Menu props
export interface ContextMenuProps extends RadixComponentProps {
  children?: React.ReactNode;
}
export interface ContextMenuTriggerProps extends RadixComponentProps {
  children?: React.ReactNode;
}
export interface ContextMenuContentProps extends RadixComponentProps {
  className?: string;
  children?: React.ReactNode;
}
export interface ContextMenuItemProps extends RadixComponentProps {
  className?: string;
  children?: React.ReactNode;
}
export interface ContextMenuSubTriggerProps extends RadixComponentProps {
  className?: string;
  children?: React.ReactNode;
}
export interface ContextMenuSubContentProps extends RadixComponentProps {
  className?: string;
  children?: React.ReactNode;
}
export interface ContextMenuCheckboxItemProps extends RadixComponentProps {
  className?: string;
  children?: React.ReactNode;
  checked?: boolean;
}
