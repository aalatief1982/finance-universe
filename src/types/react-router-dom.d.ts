/**
 * @file react-router-dom.d.ts
 * @description Type definitions for react-router-dom.d.
 *
 * @module types/react-router-dom.d
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

declare module 'react-router-dom' {
  export interface NavigateOptions {
    replace?: boolean;
    state?: any;
  }

  export interface Location {
    pathname: string;
    search: string;
    hash: string;
    state: any;
  }

  export interface NavigateFunction {
    (to: string | number, options?: NavigateOptions): void;
  }

  export function useNavigate(): NavigateFunction;
  export function useLocation(): Location;
  export function useParams(): Record<string, string>;
  export function useSearchParams(): [URLSearchParams, (nextInit: URLSearchParams) => void];

  export function Link(props: {
    to: string;
    replace?: boolean;
    state?: any;
    className?: string;
    children: React.ReactNode;
    [key: string]: any;
  }): JSX.Element;

  export function BrowserRouter(props: { children: React.ReactNode }): JSX.Element;
  export function Route(props: { path: string; element: React.ReactNode }): JSX.Element;
  export function Routes(props: { children: React.ReactNode }): JSX.Element;
}
