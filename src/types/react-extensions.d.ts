
import * as React from 'react';

declare module 'react' {
  // Update ReactNode definition to properly include ReactElement
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

  // Update Element interface to extend ReactElement correctly
  export interface Element extends React.ReactElement<any, any> {
    toString?(): string;
  }

  // Ensure HTMLAttributes accepts ReactNode for children
  export interface HTMLAttributes<T> extends React.DOMAttributes<T> {
    children?: ReactNode;
    className?: string;
    style?: React.CSSProperties;
    id?: string;
    role?: string;
  }

  // Update FormEvent to properly extend SyntheticEvent
  export interface FormEvent<T = Element> extends React.SyntheticEvent<T> {
    currentTarget: EventTarget & T;
    target: EventTarget & T;
    preventDefault(): void;
    stopPropagation(): void;
  }

  // Ensure FormEventHandler has correct typing
  export type FormEventHandler<T = Element> = (event: FormEvent<T>) => void;

  // Update DOMAttributes to accept ReactNode for children
  export interface DOMAttributes<T> {
    children?: ReactNode;
    dangerouslySetInnerHTML?: { __html: string };
    onSubmit?: FormEventHandler<T>;
    onChange?: (event: React.SyntheticEvent<T>) => void;
    onClick?: (event: React.MouseEvent<T>) => void;
  }

  // Make sure ReactElement definition is properly inclusive
  export interface ReactElement<P = any, T extends string | React.JSXElementConstructor<any> = string | React.JSXElementConstructor<any>> {
    type: T;
    props: P;
    key: React.Key | null;
    toString?(): string;
  }

  // Update ReactNodeArray to use the ReactNode type
  export type ReactNodeArray = Array<ReactNode>;

  // Add missing SyntheticEvent type
  export interface SyntheticEvent<T = Element, E = Event> extends BaseSyntheticEvent<E, EventTarget & T, EventTarget> {}

  // Add missing BaseSyntheticEvent type
  export interface BaseSyntheticEvent<E = object, C = any, T = any> {
    nativeEvent: E;
    currentTarget: C;
    target: T;
    bubbles: boolean;
    cancelable: boolean;
    defaultPrevented: boolean;
    eventPhase: number;
    isTrusted: boolean;
    preventDefault(): void;
    isDefaultPrevented(): boolean;
    stopPropagation(): void;
    isPropagationStopped(): boolean;
    persist(): void;
    timeStamp: number;
    type: string;
  }
}

export {};
