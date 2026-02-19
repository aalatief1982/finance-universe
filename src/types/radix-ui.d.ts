/**
 * @file radix-ui.d.ts
 * @description Type definitions for radix-ui.d.
 *
 * @module types/radix-ui.d
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

// Define common React component props with children
interface BaseProps {
  children?: React.ReactNode;
  className?: string;
}

// Define types for the @radix-ui/react-accordion package
declare module '@radix-ui/react-accordion' {
  export interface AccordionSingleProps extends BaseProps {
    type: "single";
    collapsible?: boolean;
    defaultValue?: string;
    value?: string;
    onValueChange?: (value: string) => void;
  }

  export interface AccordionMultipleProps extends BaseProps {
    type: "multiple";
    defaultValue?: string[];
    value?: string[];
    onValueChange?: (value: string[]) => void;
  }

  export type AccordionProps = AccordionSingleProps | AccordionMultipleProps;

  export interface AccordionItemProps extends BaseProps {
    value: string;
    disabled?: boolean;
  }

  export type AccordionHeaderProps = BaseProps;

  export type AccordionTriggerProps = BaseProps;

  export type AccordionContentProps = BaseProps;

  export const Root: React.ForwardRefExoticComponent<AccordionProps & React.RefAttributes<HTMLDivElement>>;
  export const Item: React.ForwardRefExoticComponent<AccordionItemProps & React.RefAttributes<HTMLDivElement>>;
  export const Header: React.ForwardRefExoticComponent<AccordionHeaderProps & React.RefAttributes<HTMLDivElement>>;
  export const Trigger: React.ForwardRefExoticComponent<AccordionTriggerProps & React.RefAttributes<HTMLButtonElement>>;
  export const Content: React.ForwardRefExoticComponent<AccordionContentProps & React.RefAttributes<HTMLDivElement>>;
}

// Define types for the @radix-ui/react-dialog package
declare module '@radix-ui/react-dialog' {
  export interface DialogProps extends BaseProps {
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
  }

  export interface DialogTriggerProps extends BaseProps {
    asChild?: boolean;
  }

  export interface DialogPortalProps extends BaseProps {
    container?: HTMLElement;
    forceMount?: boolean;
  }

  export interface DialogOverlayProps extends BaseProps {
    forceMount?: boolean;
  }

  export interface DialogContentProps extends BaseProps {
    forceMount?: boolean;
    onOpenAutoFocus?: (event: Event) => void;
    onCloseAutoFocus?: (event: Event) => void;
    onEscapeKeyDown?: (event: KeyboardEvent) => void;
    onInteractOutside?: (event: React.MouseEvent | React.TouchEvent) => void;
  }

  export type DialogTitleProps = BaseProps;

  export type DialogDescriptionProps = BaseProps;

  export interface DialogCloseProps extends BaseProps {
    asChild?: boolean;
  }

  export const Root: React.FC<DialogProps>;
  export const Trigger: React.ForwardRefExoticComponent<DialogTriggerProps & React.RefAttributes<HTMLButtonElement>>;
  export const Portal: React.FC<DialogPortalProps>;
  export const Overlay: React.ForwardRefExoticComponent<DialogOverlayProps & React.RefAttributes<HTMLDivElement>>;
  export const Content: React.ForwardRefExoticComponent<DialogContentProps & React.RefAttributes<HTMLDivElement>>;
  export const Title: React.ForwardRefExoticComponent<DialogTitleProps & React.RefAttributes<HTMLHeadingElement>>;
  export const Description: React.ForwardRefExoticComponent<DialogDescriptionProps & React.RefAttributes<HTMLParagraphElement>>;
  export const Close: React.ForwardRefExoticComponent<DialogCloseProps & React.RefAttributes<HTMLButtonElement>>;
}

// Define types for the @radix-ui/react-alert-dialog package
declare module '@radix-ui/react-alert-dialog' {
  export interface AlertDialogProps extends BaseProps {
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
  }

  export interface AlertDialogTriggerProps extends BaseProps {
    asChild?: boolean;
  }

  export interface AlertDialogPortalProps extends BaseProps {
    container?: HTMLElement;
    forceMount?: boolean;
  }

  export interface AlertDialogOverlayProps extends BaseProps {
    forceMount?: boolean;
    className?: string;
  }

  export interface AlertDialogContentProps extends BaseProps {
    forceMount?: boolean;
    onOpenAutoFocus?: (event: Event) => void;
    onCloseAutoFocus?: (event: Event) => void;
    onEscapeKeyDown?: (event: KeyboardEvent) => void;
  }

  export type AlertDialogTitleProps = BaseProps;

  export type AlertDialogDescriptionProps = BaseProps;

  export interface AlertDialogActionProps extends BaseProps {
    onClick?: () => void;
  }

  export type AlertDialogCancelProps = BaseProps;

  export const Root: React.FC<AlertDialogProps>;
  export const Trigger: React.ForwardRefExoticComponent<AlertDialogTriggerProps & React.RefAttributes<HTMLButtonElement>>;
  export const Portal: React.FC<AlertDialogPortalProps>;
  export const Overlay: React.ForwardRefExoticComponent<AlertDialogOverlayProps & React.RefAttributes<HTMLDivElement>>;
  export const Content: React.ForwardRefExoticComponent<AlertDialogContentProps & React.RefAttributes<HTMLDivElement>>;
  export const Title: React.ForwardRefExoticComponent<AlertDialogTitleProps & React.RefAttributes<HTMLHeadingElement>>;
  export const Description: React.ForwardRefExoticComponent<AlertDialogDescriptionProps & React.RefAttributes<HTMLParagraphElement>>;
  export const Action: React.ForwardRefExoticComponent<AlertDialogActionProps & React.RefAttributes<HTMLButtonElement>>;
  export const Cancel: React.ForwardRefExoticComponent<AlertDialogCancelProps & React.RefAttributes<HTMLButtonElement>>;
}

// Define types for the @radix-ui/react-dropdown-menu package
declare module '@radix-ui/react-dropdown-menu' {
  export interface DropdownMenuProps extends BaseProps {
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    modal?: boolean;
  }

  export interface DropdownMenuTriggerProps extends BaseProps {
    asChild?: boolean;
  }

  export interface DropdownMenuPortalProps extends BaseProps {
    container?: HTMLElement;
    forceMount?: boolean;
  }

  export interface DropdownMenuContentProps extends BaseProps {
    loop?: boolean;
    sideOffset?: number;
    alignOffset?: number;
    avoidCollisions?: boolean;
    collisionPadding?: number | { top?: number; right?: number; bottom?: number; left?: number };
    arrowPadding?: number;
    sticky?: 'partial' | 'always';
    hideWhenDetached?: boolean;
    forceMount?: boolean;
  }

  export interface DropdownMenuItemProps extends BaseProps {
    asChild?: boolean;
    disabled?: boolean;
    onSelect?: (event: Event) => void;
  }

  export interface DropdownMenuCheckboxItemProps extends BaseProps {
    checked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
    disabled?: boolean;
  }

  export interface DropdownMenuRadioGroupProps extends BaseProps {
    value?: string;
    onValueChange?: (value: string) => void;
  }

  export interface DropdownMenuRadioItemProps extends BaseProps {
    value: string;
    disabled?: boolean;
  }

  export interface DropdownMenuItemIndicatorProps extends BaseProps {
    forceMount?: boolean;
  }

  export type DropdownMenuSeparatorProps = BaseProps;

  export type DropdownMenuLabelProps = BaseProps;

  export type DropdownMenuGroupProps = BaseProps;

  export interface DropdownMenuSubProps extends BaseProps {
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
  }

  export interface DropdownMenuSubTriggerProps extends BaseProps {
    disabled?: boolean;
  }

  export interface DropdownMenuSubContentProps extends BaseProps {
    loop?: boolean;
    sideOffset?: number;
    alignOffset?: number;
    avoidCollisions?: boolean;
    collisionPadding?: number | { top?: number; right?: number; bottom?: number; left?: number };
    arrowPadding?: number;
    sticky?: 'partial' | 'always';
    hideWhenDetached?: boolean;
    forceMount?: boolean;
  }

  export const Root: React.FC<DropdownMenuProps>;
  export const Trigger: React.ForwardRefExoticComponent<DropdownMenuTriggerProps & React.RefAttributes<HTMLButtonElement>>;
  export const Portal: React.FC<DropdownMenuPortalProps>;
  export const Content: React.ForwardRefExoticComponent<DropdownMenuContentProps & React.RefAttributes<HTMLDivElement>>;
  export const Item: React.ForwardRefExoticComponent<DropdownMenuItemProps & React.RefAttributes<HTMLDivElement>>;
  export const CheckboxItem: React.ForwardRefExoticComponent<DropdownMenuCheckboxItemProps & React.RefAttributes<HTMLDivElement>>;
  export const RadioGroup: React.ForwardRefExoticComponent<DropdownMenuRadioGroupProps & React.RefAttributes<HTMLDivElement>>;
  export const RadioItem: React.ForwardRefExoticComponent<DropdownMenuRadioItemProps & React.RefAttributes<HTMLDivElement>>;
  export const ItemIndicator: React.ForwardRefExoticComponent<DropdownMenuItemIndicatorProps & React.RefAttributes<HTMLSpanElement>>;
  export const Separator: React.ForwardRefExoticComponent<DropdownMenuSeparatorProps & React.RefAttributes<HTMLDivElement>>;
  export const Label: React.ForwardRefExoticComponent<DropdownMenuLabelProps & React.RefAttributes<HTMLDivElement>>;
  export const Group: React.ForwardRefExoticComponent<DropdownMenuGroupProps & React.RefAttributes<HTMLDivElement>>;
  export const Sub: React.FC<DropdownMenuSubProps>;
  export const SubTrigger: React.ForwardRefExoticComponent<DropdownMenuSubTriggerProps & React.RefAttributes<HTMLDivElement>>;
  export const SubContent: React.ForwardRefExoticComponent<DropdownMenuSubContentProps & React.RefAttributes<HTMLDivElement>>;
}

// Define types for the @radix-ui/react-context-menu package
declare module '@radix-ui/react-context-menu' {
  export interface ContextMenuProps extends BaseProps {
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    modal?: boolean;
  }

  export type ContextMenuTriggerProps = BaseProps;

  export interface ContextMenuPortalProps extends BaseProps {
    container?: HTMLElement;
    forceMount?: boolean;
  }

  export interface ContextMenuContentProps extends BaseProps {
    loop?: boolean;
    sideOffset?: number;
    alignOffset?: number;
    avoidCollisions?: boolean;
    collisionPadding?: number | { top?: number; right?: number; bottom?: number; left?: number };
    arrowPadding?: number;
    sticky?: 'partial' | 'always';
    hideWhenDetached?: boolean;
    forceMount?: boolean;
  }

  export interface ContextMenuItemProps extends BaseProps {
    disabled?: boolean;
    onSelect?: (event: Event) => void;
    className?: string;
  }

  export interface ContextMenuCheckboxItemProps extends BaseProps {
    checked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
    disabled?: boolean;
    className?: string;
    children?: React.ReactNode;
  }

  export interface ContextMenuRadioGroupProps extends BaseProps {
    value?: string;
    onValueChange?: (value: string) => void;
  }

  export interface ContextMenuRadioItemProps extends BaseProps {
    value: string;
    disabled?: boolean;
  }

  export interface ContextMenuItemIndicatorProps extends BaseProps {
    forceMount?: boolean;
  }

  export type ContextMenuSeparatorProps = BaseProps;

  export type ContextMenuLabelProps = BaseProps;

  export type ContextMenuGroupProps = BaseProps;

  export interface ContextMenuSubProps extends BaseProps {
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
  }

  export interface ContextMenuSubTriggerProps extends BaseProps {
    disabled?: boolean;
    className?: string;
    children?: React.ReactNode;
  }

  export interface ContextMenuSubContentProps extends BaseProps {
    loop?: boolean;
    sideOffset?: number;
    alignOffset?: number;
    avoidCollisions?: boolean;
    collisionPadding?: number | { top?: number; right?: number; bottom?: number; left?: number };
    arrowPadding?: number;
    sticky?: 'partial' | 'always';
    hideWhenDetached?: boolean;
    forceMount?: boolean;
    className?: string;
  }

  export const Root: React.FC<ContextMenuProps>;
  export const Trigger: React.ForwardRefExoticComponent<ContextMenuTriggerProps & React.RefAttributes<HTMLSpanElement>>;
  export const Portal: React.FC<ContextMenuPortalProps>;
  export const Content: React.ForwardRefExoticComponent<ContextMenuContentProps & React.RefAttributes<HTMLDivElement>>;
  export const Item: React.ForwardRefExoticComponent<ContextMenuItemProps & React.RefAttributes<HTMLDivElement>>;
  export const CheckboxItem: React.ForwardRefExoticComponent<ContextMenuCheckboxItemProps & React.RefAttributes<HTMLDivElement>>;
  export const RadioGroup: React.ForwardRefExoticComponent<ContextMenuRadioGroupProps & React.RefAttributes<HTMLDivElement>>;
  export const RadioItem: React.ForwardRefExoticComponent<ContextMenuRadioItemProps & React.RefAttributes<HTMLDivElement>>;
  export const ItemIndicator: React.ForwardRefExoticComponent<ContextMenuItemIndicatorProps & React.RefAttributes<HTMLSpanElement>>;
  export const Separator: React.ForwardRefExoticComponent<ContextMenuSeparatorProps & React.RefAttributes<HTMLDivElement>>;
  export const Label: React.ForwardRefExoticComponent<ContextMenuLabelProps & React.RefAttributes<HTMLDivElement>>;
  export const Group: React.ForwardRefExoticComponent<ContextMenuGroupProps & React.RefAttributes<HTMLDivElement>>;
  export const Sub: React.FC<ContextMenuSubProps>;
  export const SubTrigger: React.ForwardRefExoticComponent<ContextMenuSubTriggerProps & React.RefAttributes<HTMLDivElement>>;
  export const SubContent: React.ForwardRefExoticComponent<ContextMenuSubContentProps & React.RefAttributes<HTMLDivElement>>;
}

// Define types for the @radix-ui/react-scroll-area package
declare module '@radix-ui/react-scroll-area' {
  type Direction = 'ltr' | 'rtl';
  
  export interface ScrollAreaProps extends BaseProps {
    type?: 'auto' | 'always' | 'scroll' | 'hover';
    scrollHideDelay?: number;
    dir?: Direction;
  }

  export type ScrollAreaViewportProps = BaseProps;

  export interface ScrollAreaScrollbarProps extends BaseProps {
    orientation?: 'vertical' | 'horizontal';
    forceMount?: true;
  }

  export type ScrollAreaThumbProps = BaseProps;

  export type ScrollAreaCornerProps = BaseProps;

  export const Root: React.ForwardRefExoticComponent<ScrollAreaProps & React.RefAttributes<HTMLDivElement>>;
  export const Viewport: React.ForwardRefExoticComponent<ScrollAreaViewportProps & React.RefAttributes<HTMLDivElement>>;
  export const Scrollbar: React.ForwardRefExoticComponent<ScrollAreaScrollbarProps & React.RefAttributes<HTMLDivElement>>;
  export const Thumb: React.ForwardRefExoticComponent<ScrollAreaThumbProps & React.RefAttributes<HTMLDivElement>>;
  export const Corner: React.ForwardRefExoticComponent<ScrollAreaCornerProps & React.RefAttributes<HTMLDivElement>>;
}

// Define types for the @radix-ui/react-collapsible package
declare module '@radix-ui/react-collapsible' {
  export interface CollapsibleProps extends BaseProps {
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    disabled?: boolean;
  }

  export type CollapsibleTriggerProps = BaseProps;

  export interface CollapsibleContentProps extends BaseProps {
    forceMount?: true;
  }

  export const Root: React.ForwardRefExoticComponent<CollapsibleProps & React.RefAttributes<HTMLDivElement>>;
  export const Trigger: React.ForwardRefExoticComponent<CollapsibleTriggerProps & React.RefAttributes<HTMLButtonElement>>;
  export const Content: React.ForwardRefExoticComponent<CollapsibleContentProps & React.RefAttributes<HTMLDivElement>>;
}

// Define types for the @radix-ui/react-checkbox package
declare module '@radix-ui/react-checkbox' {
  export interface CheckboxProps extends BaseProps {
    checked?: boolean;
    defaultChecked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
    disabled?: boolean;
    required?: boolean;
    name?: string;
    value?: string;
  }

  export interface CheckboxIndicatorProps extends BaseProps {
    forceMount?: true;
  }

  export const Root: React.ForwardRefExoticComponent<CheckboxProps & React.RefAttributes<HTMLButtonElement>>;
  export const Indicator: React.ForwardRefExoticComponent<CheckboxIndicatorProps & React.RefAttributes<HTMLSpanElement>>;
}

// Define types for recharts
declare module 'recharts' {
  export interface LegendProps {
    width?: number;
    height?: number;
    layout?: 'horizontal' | 'vertical';
    align?: 'left' | 'center' | 'right';
    verticalAlign?: 'top' | 'middle' | 'bottom';
    iconSize?: number;
    iconType?: 'line' | 'square' | 'rect' | 'circle' | 'cross' | 'diamond' | 'star' | 'triangle' | 'wye';
    payload?: Array<{
      value: string;
      type?: string;
      id?: string;
      color?: string;
    }>;
    chartWidth?: number;
    chartHeight?: number;
    margin?: {
      top?: number;
      right?: number;
      bottom?: number;
      left?: number;
    };
    content?: React.ReactElement | React.FC;
    wrapperStyle?: React.CSSProperties;
    onClick?: (data: unknown) => void;
    onMouseEnter?: (data: unknown) => void;
    onMouseLeave?: (data: unknown) => void;
  }
}

// Define types for react-hook-form
declare module 'react-hook-form' {
  export type FieldValues = Record<string, unknown>;
  
  export type Control<TFieldValues extends FieldValues = FieldValues> = unknown;
  
  export type FieldPath<TFieldValues extends FieldValues = FieldValues> = string;
  
  export type UseFormRegister<TFieldValues extends FieldValues> = (name: string) => {
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    onBlur: () => void;
    ref: (ref: unknown) => void;
    name: string;
  };

  export type SubmitHandler<TFieldValues extends FieldValues> = (
    data: TFieldValues,
    e?: React.BaseSyntheticEvent,
  ) => void | Promise<void>;
  
  export type UseFormReturn<TFieldValues extends FieldValues> = {
    register: UseFormRegister<TFieldValues>;
    handleSubmit: (onSubmit: SubmitHandler<TFieldValues>) => (e?: React.BaseSyntheticEvent) => Promise<void>;
    formState: {
      errors: Record<string, unknown>;
      isSubmitting: boolean;
    };
    control: Control<TFieldValues>;
    reset: (values?: TFieldValues) => void;
    setValue: (name: string, value: unknown) => void;
    getValues: () => TFieldValues;
    watch: (name?: string | string[]) => unknown;
  };
  
  export function useForm<TFieldValues extends FieldValues = FieldValues>(options?: {
    defaultValues?: TFieldValues;
    resolver?: unknown;
    mode?: 'onSubmit' | 'onChange' | 'onBlur' | 'all';
  }): UseFormReturn<TFieldValues>;
  
  export function Controller(props: {
    name: string;
    control: Control;
    defaultValue?: unknown;
    render: (props: { field: unknown; fieldState: unknown }) => React.ReactElement;
  }): JSX.Element;
  
  export const FormProvider: React.FC<{
    children: React.ReactNode;
    [key: string]: unknown;
  }>;
  
  export function useFormContext<TFieldValues extends FieldValues = FieldValues>(): UseFormReturn<TFieldValues>;
}
