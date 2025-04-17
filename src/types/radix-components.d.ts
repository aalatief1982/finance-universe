
// Enhanced typings for Radix UI components used by shadcn/ui

import * as React from 'react';

// Define common React component props with children
interface BaseProps {
  children?: React.ReactNode;
  className?: string;
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
  interface DialogCloseProps extends BaseProps {}
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
  interface DropdownMenuItemProps extends BaseProps {}
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
  interface SelectTriggerProps extends BaseProps {}
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
