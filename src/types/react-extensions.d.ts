
import * as React from 'react';

declare module 'react' {
  // Comprehensive ReactNode definition
  export type ReactNode = 
    | React.ReactElement
    | string
    | number
    | boolean
    | null
    | undefined
    | React.ReactNodeArray
    | React.ReactPortal
    | Iterable<React.ReactNode>;

  // Make ReactElement properly compatible with string
  export interface ReactElement<P = any, T extends string | React.JSXElementConstructor<any> = string | React.JSXElementConstructor<any>> {
    type: T;
    props: P;
    key: React.Key | null;
  }

  // Update HTMLAttributes to properly accept ReactNode for children
  export interface HTMLAttributes<T> extends React.DOMAttributes<T> {
    children?: ReactNode;
    className?: string;
    style?: React.CSSProperties;
    id?: string;
    role?: string;
  }

  // Form event handlers need proper typing
  export interface FormEvent<T = Element> extends React.SyntheticEvent<T> {
    currentTarget: EventTarget & T;
    target: EventTarget & T;
  }

  export interface FormEventHandler<T = Element> {
    (event: FormEvent<T>): void;
  }

  // Update DOMAttributes to accept ReactNode for children
  export interface DOMAttributes<T> {
    children?: ReactNode;
    dangerouslySetInnerHTML?: { __html: string };
    onSubmit?: FormEventHandler<T>;
    onChange?: (event: React.SyntheticEvent<T>) => void;
    onClick?: (event: React.MouseEvent<T>) => void;
  }

  // Add React.lazy and Suspense definitions to prevent TypeScript errors
  export function lazy<T extends React.ComponentType<any>>(
    factory: () => Promise<{ default: T }>
  ): T;

  export interface SuspenseProps {
    fallback?: ReactNode;
    children?: ReactNode;
  }

  export const Suspense: React.ComponentType<SuspenseProps>;
}
