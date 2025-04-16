
import * as React from 'react';

declare module 'react' {
  export type KeyboardEvent<T = Element> = React.SyntheticEvent<T> & {
    altKey: boolean;
    charCode: number;
    ctrlKey: boolean;
    key: string;
    keyCode: number;
    locale: string;
    location: number;
    metaKey: boolean;
    repeat: boolean;
    shiftKey: boolean;
    which: number;
  };

  export type ChangeEvent<T = Element> = React.SyntheticEvent<T> & {
    target: EventTarget & T;
  };

  export interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
    // Extended with additional attributes
    role?: string;
    'aria-label'?: string;
    'aria-labelledby'?: string;
    'aria-describedby'?: string;
    'aria-disabled'?: boolean;
    'aria-busy'?: boolean;
  }
  
  // Explicitly define ReactNode to include React.Element
  export type ReactNode = React.ReactElement | string | number | boolean | null | undefined | React.ReactNodeArray | React.ReactPortal;
  export type ReactNodeArray = Array<ReactNode>;
  
  // Add missing Element type to fix "Type 'Element' is not assignable to type 'string'" errors
  export interface ReactElement<P = any, T extends string | JSXElementConstructor<any> = string | JSXElementConstructor<any>> {
    type: T;
    props: P;
    key: Key | null;
  }
}
