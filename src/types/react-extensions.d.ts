
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

  export interface HTMLAttributes<T> {
    children?: ReactNode;
  }

  export interface FormEvent<T = Element> extends React.SyntheticEvent<T> {
    currentTarget: EventTarget & T;
    target: EventTarget & T;
    preventDefault(): void;
    stopPropagation(): void;
  }

  // Update ReactElement to be more permissive
  export interface ReactElement<P = any, T extends string | React.JSXElementConstructor<any> = string | React.JSXElementConstructor<any>> {
    type: T;
    props: P;
    key: React.Key | null;
    toString?(): string;
  }
}

export {};

