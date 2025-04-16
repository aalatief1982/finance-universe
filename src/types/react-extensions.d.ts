
import * as React from 'react';

declare module 'react' {
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

  export interface Element extends React.ReactElement<any, any> {
    // Extend Element type to be more flexible
    toString?(): string;
  }

  export interface HTMLAttributes<T> extends React.DOMAttributes<T> {
    children?: ReactNode;
    className?: string;
    style?: React.CSSProperties;
    // Add other common HTML attributes
    id?: string;
    role?: string;
  }

  export interface FormEvent<T = Element> extends React.SyntheticEvent<T> {
    currentTarget: EventTarget & T;
    target: EventTarget & T;
    preventDefault(): void;
    stopPropagation(): void;
  }

  export type FormEventHandler<T = Element> = (event: FormEvent<T>) => void;

  export interface DOMAttributes<T> {
    children?: ReactNode;
    dangerouslySetInnerHTML?: { __html: string };
    onSubmit?: FormEventHandler<T>;
    onChange?: (event: React.SyntheticEvent<T>) => void;
    onClick?: (event: React.MouseEvent<T>) => void;
    // Add other event handlers as needed
  }

  // Update ReactElement to be more permissive
  export interface ReactElement<P = any, T extends string | React.JSXElementConstructor<any> = string | React.JSXElementConstructor<any>> {
    type: T;
    props: P;
    key: React.Key | null;
    toString?(): string;
  }

  export type ReactNodeArray = ReactNode[];
}

export {};
