declare module 'react' {
  import * as CSS from 'csstype';

  export interface CSSProperties extends CSS.Properties<string | number> {}
  
  export type ReactNode = React.ReactElement | string | number | boolean | null | undefined;
  
  export interface ReactElement<P = any, T extends string | JSXElementConstructor<any> = string | JSXElementConstructor<any>> {
    type: T;
    props: P;
    key: string | null;
  }
  
  export type JSXElementConstructor<P> = (props: P) => ReactElement<any, any> | null;
  
  export interface RefObject<T> {
    readonly current: T | null;
  }
  
  export type Ref<T> = RefCallback<T> | RefObject<T> | null;
  
  export type RefCallback<T> = (instance: T | null) => void;
  
  export type ForwardedRef<T> = Ref<T>;
  
  export interface RefAttributes<T> extends Attributes {
    ref?: Ref<T>;
  }
  
  export interface Attributes {
    key?: string | number;
  }
  
  export interface DOMAttributes<T> {
    children?: ReactNode;
    dangerouslySetInnerHTML?: { __html: string };
    onClick?: (event: MouseEvent<T>) => void;
    onChange?: (event: FormEvent<T>) => void;
    onSubmit?: (event: FormEvent<T>) => void;
    // Add other event handlers as needed
  }
  
  export interface HTMLAttributes<T> extends DOMAttributes<T> {
    className?: string;
    style?: CSSProperties;
    id?: string;
    // Add other HTML attributes as needed
  }
  
  export interface FormEvent<T = Element> {
    currentTarget: EventTarget & T;
    target: EventTarget;
    preventDefault(): void;
    stopPropagation(): void;
  }
  
  export interface MouseEvent<T = Element> {
    currentTarget: EventTarget & T;
    target: EventTarget;
    preventDefault(): void;
    stopPropagation(): void;
  }
  
  export interface SyntheticEvent<T = Element> {
    currentTarget: EventTarget & T;
    target: EventTarget;
    preventDefault(): void;
    stopPropagation(): void;
  }
  
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
  
  export function createElement(
    type: string | JSXElementConstructor<any>,
    props?: any,
    ...children: ReactNode[]
  ): ReactElement;
  
  export function cloneElement<P>(
    element: ReactElement<P>,
    props?: Partial<P>,
    ...children: ReactNode[]
  ): ReactElement<P>;
  
  export function createContext<T>(defaultValue: T): Context<T>;
  
  export interface Context<T> {
    Provider: Provider<T>;
    Consumer: Consumer<T>;
    displayName?: string;
  }
  
  export interface Provider<T> {
    new (props: { value: T; children?: ReactNode }): ReactElement;
  }
  
  export interface Consumer<T> {
    new (props: { children: (value: T) => ReactNode }): ReactElement;
  }
  
  export function useState<S>(initialState: S | (() => S)): [S, (newState: S | ((prevState: S) => S)) => void];
  
  export function useEffect(effect: () => void | (() => void), deps?: readonly any[]): void;
  
  export function useContext<T>(context: Context<T>): T;
  
  export function useRef<T>(initialValue: T | null): { current: T | null };
  
  export function useCallback<T extends (...args: any[]) => any>(callback: T, deps: readonly any[]): T;
  
  export function useMemo<T>(factory: () => T, deps: readonly any[]): T;

  export function useReducer<R extends Reducer<any, any>, I>(
    reducer: R,
    initialArg: I,
    init?: (arg: I) => ReducerState<R>
  ): [ReducerState<R>, Dispatch<ReducerAction<R>>];

  export type Reducer<S, A> = (prevState: S, action: A) => S;
  export type ReducerAction<R extends Reducer<any, any>> = R extends Reducer<any, infer A> ? A : never;
  export type ReducerState<R extends Reducer<any, any>> = R extends Reducer<infer S, any> ? S : never;
  export type Dispatch<A> = (action: A) => void;

  export interface FunctionComponent<P = {}> {
    (props: P, context?: any): ReactElement<any, any> | null;
    displayName?: string;
  }

  export type FC<P = {}> = FunctionComponent<P>;

  export interface ForwardRefExoticComponent<P> extends NamedExoticComponent<P> {
    defaultProps?: Partial<P>;
    displayName?: string;
  }

  export interface NamedExoticComponent<P = {}> {
    (props: P): ReactElement | null;
    displayName?: string;
  }

  export function forwardRef<T, P = {}>(render: (props: P, ref: ForwardedRef<T>) => ReactElement | null): ForwardRefExoticComponent<PropsWithoutRef<P> & RefAttributes<T>>;

  export type PropsWithChildren<P = unknown> = P & { children?: ReactNode | undefined };
  export type PropsWithoutRef<P> = P;

  export interface ExoticComponent<P = {}> {
    (props: P): ReactElement | null;
  }

  export interface ClassAttributes<T> extends Attributes {
    ref?: Ref<T> | undefined;
  }

  export interface SVGAttributes<T> extends HTMLAttributes<T> {
    // Add SVG-specific attributes as needed
  }

  export type ComponentType<P = {}> = ComponentClass<P> | FC<P>;

  export interface ComponentClass<P = {}, S = {}> {
    new(props: P, context?: any): Component<P, S>;
    displayName?: string;
    defaultProps?: Partial<P>;
  }

  export class Component<P, S> {
    constructor(props: P, context?: any);
    props: P;
    state: S;
    context: any;
    refs: {
      [key: string]: any;
    };
    setState<K extends keyof S>(
      state: ((prevState: Readonly<S>, props: Readonly<P>) => (Pick<S, K> | S | null)) | (Pick<S, K> | S | null),
      callback?: () => void
    ): void;
    forceUpdate(callback?: () => void): void;
    render(): ReactNode;
  }

  export type CElement<P, T extends Component<P, any>> = ComponentElement<P, T>;
  export interface ComponentElement<P, T extends Component<P, any>> extends ReactElement<P> {
    ref?: Ref<T>;
    type: ComponentType<P>;
  }
}

declare module 'react/jsx-runtime' {
  export { createElement as jsx, createElement as jsxs, createElement as jsxDEV } from 'react';
}
