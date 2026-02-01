/**
 * @file radix-components.d.ts
 * @description Type definitions for radix-components.d.
 *
 * @module types/radix-components.d
 *
 * @responsibilities
 * 1. Define shared interfaces and type aliases
 * 2. Provide consistent contracts across services and UI
 *
 * @review-tags
 * - @data-contract: shared types
 *
 * @review-checklist
 * - [ ] Types align with runtime data shapes
 * - [ ] Optional fields documented where needed
 */

// Enhanced typings for Radix UI components used by shadcn/ui

import * as React from 'react';

// Define common React component props with children
interface BaseProps {
  children?: React.ReactNode;
  className?: string;
}

// Dialog Components
declare module '@radix-ui/react-dialog' {
  type DialogProps = BaseProps;
  type DialogTriggerProps = BaseProps;
  type DialogContentProps = BaseProps;
  type DialogHeaderProps = BaseProps;
  type DialogFooterProps = BaseProps;
  type DialogTitleProps = BaseProps;
  type DialogDescriptionProps = BaseProps;
  type DialogCloseProps = BaseProps;
}

// Navigation Menu Components
declare module '@radix-ui/react-navigation-menu' {
  type NavigationMenuProps = BaseProps;
  type NavigationMenuListProps = BaseProps;
  type NavigationMenuItemProps = BaseProps;
  type NavigationMenuTriggerProps = BaseProps;
  type NavigationMenuContentProps = BaseProps;
  type NavigationMenuLinkProps = BaseProps;
}

// Dropdown Menu Components
declare module '@radix-ui/react-dropdown-menu' {
  type DropdownMenuProps = BaseProps;
  type DropdownMenuTriggerProps = BaseProps;
  type DropdownMenuContentProps = BaseProps;
  type DropdownMenuItemProps = BaseProps;
  type DropdownMenuLabelProps = BaseProps;
  type DropdownMenuSeparatorProps = BaseProps;
}

// Avatar Components
declare module '@radix-ui/react-avatar' {
  type AvatarProps = BaseProps;
  
  interface AvatarImageProps extends BaseProps {
    src?: string;
    alt?: string;
  }
  
  type AvatarFallbackProps = BaseProps;
}

// Tabs Components
declare module '@radix-ui/react-tabs' {
  interface TabsProps extends BaseProps {
    value?: string;
    onValueChange?: (value: string) => void;
    defaultValue?: string;
  }
  
  type TabsListProps = BaseProps;
  
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
  type SelectProps = BaseProps;
  type SelectTriggerProps = BaseProps;
  type SelectContentProps = BaseProps;
  interface SelectItemProps extends BaseProps {
    value?: string;
  }
  type SelectValueProps = BaseProps;
}

// Switch Components
declare module '@radix-ui/react-switch' {
  interface SwitchProps extends BaseProps {
    checked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
    id?: string;
  }
}
