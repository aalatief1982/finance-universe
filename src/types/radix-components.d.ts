
// Enhanced typings for Radix UI components used by shadcn/ui

import * as React from 'react';

// Define common React component props with children
interface BaseProps {
  children?: React.ReactNode;
  className?: string;
  asChild?: boolean;
}

// Dialog Components
declare module '@radix-ui/react-dialog' {
  interface DialogProps extends BaseProps {}
  interface DialogTriggerProps extends BaseProps {}
  interface DialogContentProps extends BaseProps {}
  interface DialogHeaderProps extends BaseProps {}
  interface DialogFooterProps extends BaseProps {}
  interface DialogTitleProps extends BaseProps {}
  interface DialogDescriptionProps extends BaseProps {}
  interface DialogCloseProps extends BaseProps {
    key?: string;
  }
}

// Navigation Menu Components
declare module '@radix-ui/react-navigation-menu' {
  interface NavigationMenuProps extends BaseProps {}
  interface NavigationMenuListProps extends BaseProps {}
  interface NavigationMenuItemProps extends BaseProps {}
  interface NavigationMenuTriggerProps extends BaseProps {}
  interface NavigationMenuContentProps extends BaseProps {}
  interface NavigationMenuLinkProps extends BaseProps {}
}

// Dropdown Menu Components
declare module '@radix-ui/react-dropdown-menu' {
  interface DropdownMenuProps extends BaseProps {}
  interface DropdownMenuTriggerProps extends BaseProps {}
  interface DropdownMenuContentProps extends BaseProps {}
  interface DropdownMenuItemProps extends BaseProps {
    onClick?: () => void;
    inset?: boolean;
  }
  interface DropdownMenuLabelProps extends BaseProps {}
  interface DropdownMenuSeparatorProps extends BaseProps {}
}

// Avatar Components
declare module '@radix-ui/react-avatar' {
  interface AvatarProps extends BaseProps {}
  
  interface AvatarImageProps extends BaseProps {
    src?: string;
    alt?: string;
  }
  
  interface AvatarFallbackProps extends BaseProps {}
}

// Tabs Components
declare module '@radix-ui/react-tabs' {
  interface TabsProps extends BaseProps {
    value?: string;
    onValueChange?: (value: string) => void;
    defaultValue?: string;
  }
  
  interface TabsListProps extends BaseProps {}
  
  interface TabsTriggerProps extends BaseProps {
    value?: string;
  }
  
  interface TabsContentProps extends BaseProps {
    value?: string;
  }
}

// Label Components
declare module '@radix-ui/react-label' {
  interface LabelProps extends BaseProps {
    htmlFor?: string;
  }
}

// Select Components
declare module '@radix-ui/react-select' {
  interface SelectProps extends BaseProps {}
  interface SelectTriggerProps extends BaseProps {
    id?: string;
  }
  interface SelectContentProps extends BaseProps {}
  interface SelectItemProps extends BaseProps {
    value?: string;
  }
  interface SelectValueProps extends BaseProps {}
}

// Switch Components
declare module '@radix-ui/react-switch' {
  interface SwitchProps extends BaseProps {
    checked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
    id?: string;
  }
}

// Progress Component
declare module '@radix-ui/react-progress' {
  interface ProgressProps extends BaseProps {
    value?: number;
    className?: string;
    indicatorClassName?: string;
    'aria-valuemin'?: number;
    'aria-valuemax'?: number;
    'aria-valuenow'?: number;
    'aria-label'?: string;
  }
}

// Accordion Components
declare module '@radix-ui/react-accordion' {
  interface AccordionProps extends BaseProps {
    type?: 'single' | 'multiple';
    defaultValue?: string | string[];
    value?: string | string[];
    onValueChange?: (value: string | string[]) => void;
    collapsible?: boolean;
  }
  
  interface AccordionItemProps extends BaseProps {
    value?: string;
    key?: string;
  }
  
  interface AccordionTriggerProps extends BaseProps {}
  
  interface AccordionContentProps extends BaseProps {}
}

// Scroll Area Components
declare module '@radix-ui/react-scroll-area' {
  interface ScrollAreaProps extends BaseProps {
    style?: React.CSSProperties;
  }
}

// Popover Components
declare module '@radix-ui/react-popover' {
  interface PopoverProps extends BaseProps {}
  interface PopoverTriggerProps extends BaseProps {}
  interface PopoverContentProps extends BaseProps {
    align?: string;
    side?: string;
    sideOffset?: number;
  }
}
