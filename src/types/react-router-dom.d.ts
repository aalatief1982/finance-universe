
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
