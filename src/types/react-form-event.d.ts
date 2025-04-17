
import * as React from 'react';

declare module 'react' {
  export interface FormEvent<T = Element> extends React.SyntheticEvent<T> {
    currentTarget: EventTarget & T;
    target: EventTarget & T;
    preventDefault(): void;
    stopPropagation(): void;
  }

  export type FormEventHandler<T = Element> = (event: FormEvent<T>) => void;

  export interface HTMLFormElement extends HTMLElement {
    reportValidity(): boolean;
    reset(): void;
    submit(): void;
  }
}
