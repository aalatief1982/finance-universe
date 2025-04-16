declare module 'framer-motion' {
  import * as React from 'react';

  export interface AnimatePresenceProps {
    children?: React.ReactNode;
    custom?: any;
    initial?: boolean;
    mode?: 'sync' | 'wait' | 'popLayout';
    onExitComplete?: () => void;
    exitBeforeEnter?: boolean;
    presenceAffectsLayout?: boolean;
  }

  export const AnimatePresence: React.FC<AnimatePresenceProps>;

  export interface MotionProps {
    initial?: any;
    animate?: any;
    exit?: any;
    transition?: any;
    variants?: any;
    whileHover?: any;
    whileTap?: any;
    whileFocus?: any;
    whileDrag?: any;
    whileInView?: any;
    viewport?: any;
    layoutId?: string;
    layout?: boolean | string;
    drag?: boolean | 'x' | 'y';
    dragConstraints?: any;
    onHoverStart?: () => void;
    onHoverEnd?: () => void;
  }

  export const motion: {
    div: React.ForwardRefExoticComponent<MotionProps & React.HTMLAttributes<HTMLDivElement>>;
    span: React.ForwardRefExoticComponent<MotionProps & React.HTMLAttributes<HTMLSpanElement>>;
    button: React.ForwardRefExoticComponent<MotionProps & React.ButtonHTMLAttributes<HTMLButtonElement>>;
    a: React.ForwardRefExoticComponent<MotionProps & React.AnchorHTMLAttributes<HTMLAnchorElement>>;
    ul: React.ForwardRefExoticComponent<MotionProps & React.HTMLAttributes<HTMLUListElement>>;
    li: React.ForwardRefExoticComponent<MotionProps & React.HTMLAttributes<HTMLLIElement>>;
    nav: React.ForwardRefExoticComponent<MotionProps & React.HTMLAttributes<HTMLElement>>;
    p: React.ForwardRefExoticComponent<MotionProps & React.HTMLAttributes<HTMLParagraphElement>>;
    h1: React.ForwardRefExoticComponent<MotionProps & React.HTMLAttributes<HTMLHeadingElement>>;
    h2: React.ForwardRefExoticComponent<MotionProps & React.HTMLAttributes<HTMLHeadingElement>>;
    h3: React.ForwardRefExoticComponent<MotionProps & React.HTMLAttributes<HTMLHeadingElement>>;
    h4: React.ForwardRefExoticComponent<MotionProps & React.HTMLAttributes<HTMLHeadingElement>>;
    h5: React.ForwardRefExoticComponent<MotionProps & React.HTMLAttributes<HTMLHeadingElement>>;
    h6: React.ForwardRefExoticComponent<MotionProps & React.HTMLAttributes<HTMLHeadingElement>>;
  };
}
