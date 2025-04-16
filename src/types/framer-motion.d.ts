
declare module 'framer-motion' {
  import * as React from 'react';

  export interface MotionProps {
    initial?: any;
    animate?: any;
    exit?: any;
    transition?: any;
    variants?: any;
    className?: string;
    style?: React.CSSProperties;
    onAnimationComplete?: () => void;
    layout?: boolean | string;
    layoutId?: string;
    whileHover?: any;
    whileTap?: any;
    whileFocus?: any;
    whileDrag?: any;
    drag?: boolean | 'x' | 'y';
    dragConstraints?: any;
    viewport?: any;
  }

  export interface AnimatePresenceProps {
    children?: React.ReactNode;
    custom?: any;
    initial?: boolean;
    onExitComplete?: () => void;
    exitBeforeEnter?: boolean;
    presenceAffectsLayout?: boolean;
    mode?: 'sync' | 'wait' | 'popLayout';
  }

  export const motion: {
    div: React.ForwardRefExoticComponent<MotionProps & React.HTMLAttributes<HTMLDivElement>>;
    span: React.ForwardRefExoticComponent<MotionProps & React.HTMLAttributes<HTMLSpanElement>>;
    button: React.ForwardRefExoticComponent<MotionProps & React.ButtonHTMLAttributes<HTMLButtonElement>>;
    a: React.ForwardRefExoticComponent<MotionProps & React.AnchorHTMLAttributes<HTMLAnchorElement>>;
    ul: React.ForwardRefExoticComponent<MotionProps & React.HTMLAttributes<HTMLUListElement>>;
    li: React.ForwardRefExoticComponent<MotionProps & React.HTMLAttributes<HTMLLIElement>>;
    img: React.ForwardRefExoticComponent<MotionProps & React.ImgHTMLAttributes<HTMLImageElement>>;
    p: React.ForwardRefExoticComponent<MotionProps & React.HTMLAttributes<HTMLParagraphElement>>;
    h1: React.ForwardRefExoticComponent<MotionProps & React.HTMLAttributes<HTMLHeadingElement>>;
    h2: React.ForwardRefExoticComponent<MotionProps & React.HTMLAttributes<HTMLHeadingElement>>;
    h3: React.ForwardRefExoticComponent<MotionProps & React.HTMLAttributes<HTMLHeadingElement>>;
    h4: React.ForwardRefExoticComponent<MotionProps & React.HTMLAttributes<HTMLHeadingElement>>;
    h5: React.ForwardRefExoticComponent<MotionProps & React.HTMLAttributes<HTMLHeadingElement>>;
    h6: React.ForwardRefExoticComponent<MotionProps & React.HTMLAttributes<HTMLHeadingElement>>;
    nav: React.ForwardRefExoticComponent<MotionProps & React.HTMLAttributes<HTMLElement>>;
    section: React.ForwardRefExoticComponent<MotionProps & React.HTMLAttributes<HTMLElement>>;
    header: React.ForwardRefExoticComponent<MotionProps & React.HTMLAttributes<HTMLElement>>;
    footer: React.ForwardRefExoticComponent<MotionProps & React.HTMLAttributes<HTMLElement>>;
    main: React.ForwardRefExoticComponent<MotionProps & React.HTMLAttributes<HTMLElement>>;
    article: React.ForwardRefExoticComponent<MotionProps & React.HTMLAttributes<HTMLElement>>;
    aside: React.ForwardRefExoticComponent<MotionProps & React.HTMLAttributes<HTMLElement>>;
    form: React.ForwardRefExoticComponent<MotionProps & React.FormHTMLAttributes<HTMLFormElement>>;
    input: React.ForwardRefExoticComponent<MotionProps & React.InputHTMLAttributes<HTMLInputElement>>;
    textarea: React.ForwardRefExoticComponent<MotionProps & React.TextareaHTMLAttributes<HTMLTextAreaElement>>;
    select: React.ForwardRefExoticComponent<MotionProps & React.SelectHTMLAttributes<HTMLSelectElement>>;
    option: React.ForwardRefExoticComponent<MotionProps & React.OptionHTMLAttributes<HTMLOptionElement>>;
    label: React.ForwardRefExoticComponent<MotionProps & React.LabelHTMLAttributes<HTMLLabelElement>>;
    svg: React.ForwardRefExoticComponent<MotionProps & React.SVGAttributes<SVGSVGElement>>;
    path: React.ForwardRefExoticComponent<MotionProps & React.SVGAttributes<SVGPathElement>>;
    circle: React.ForwardRefExoticComponent<MotionProps & React.SVGAttributes<SVGCircleElement>>;
    rect: React.ForwardRefExoticComponent<MotionProps & React.SVGAttributes<SVGRectElement>>;
    line: React.ForwardRefExoticComponent<MotionProps & React.SVGAttributes<SVGLineElement>>;
  };

  export const AnimatePresence: React.FC<AnimatePresenceProps>;
  
  export function useAnimation(): any;
  export function useMotionValue(initial: any): any;
  export function useTransform(value: any, input: any[], output: any[]): any;
  export function useCycle(...args: any[]): [any, (i?: number) => void];
}
