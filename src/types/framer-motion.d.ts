
declare module 'framer-motion' {
  import * as React from 'react';

  export interface AnimatePresenceProps {
    initial?: boolean;
    custom?: any;
    exitBeforeEnter?: boolean;
    onExitComplete?: () => void;
    children?: React.ReactNode;
  }

  export const AnimatePresence: React.FC<AnimatePresenceProps>;
  
  export interface MotionProps {
    initial?: any;
    animate?: any;
    exit?: any;
    transition?: any;
    whileHover?: any;
    whileTap?: any;
    whileFocus?: any;
    whileDrag?: any;
    className?: string;
    style?: React.CSSProperties;
    children?: React.ReactNode;
    onClick?: () => void;
  }
  
  export const motion: {
    div: React.ForwardRefExoticComponent<MotionProps & React.RefAttributes<HTMLDivElement>>;
    button: React.ForwardRefExoticComponent<MotionProps & React.RefAttributes<HTMLButtonElement>>;
    span: React.ForwardRefExoticComponent<MotionProps & React.RefAttributes<HTMLSpanElement>>;
    a: React.ForwardRefExoticComponent<MotionProps & React.RefAttributes<HTMLAnchorElement>>;
    p: React.ForwardRefExoticComponent<MotionProps & React.RefAttributes<HTMLParagraphElement>>;
    nav: React.ForwardRefExoticComponent<MotionProps & React.RefAttributes<HTMLElement>>;
    ul: React.ForwardRefExoticComponent<MotionProps & React.RefAttributes<HTMLUListElement>>;
    li: React.ForwardRefExoticComponent<MotionProps & React.RefAttributes<HTMLLIElement>>;
    header: React.ForwardRefExoticComponent<MotionProps & React.RefAttributes<HTMLElement>>;
    footer: React.ForwardRefExoticComponent<MotionProps & React.RefAttributes<HTMLElement>>;
    section: React.ForwardRefExoticComponent<MotionProps & React.RefAttributes<HTMLElement>>;
    main: React.ForwardRefExoticComponent<MotionProps & React.RefAttributes<HTMLElement>>;
    aside: React.ForwardRefExoticComponent<MotionProps & React.RefAttributes<HTMLElement>>;
    article: React.ForwardRefExoticComponent<MotionProps & React.RefAttributes<HTMLElement>>;
    h1: React.ForwardRefExoticComponent<MotionProps & React.RefAttributes<HTMLHeadingElement>>;
    h2: React.ForwardRefExoticComponent<MotionProps & React.RefAttributes<HTMLHeadingElement>>;
    h3: React.ForwardRefExoticComponent<MotionProps & React.RefAttributes<HTMLHeadingElement>>;
    h4: React.ForwardRefExoticComponent<MotionProps & React.RefAttributes<HTMLHeadingElement>>;
    h5: React.ForwardRefExoticComponent<MotionProps & React.RefAttributes<HTMLHeadingElement>>;
    h6: React.ForwardRefExoticComponent<MotionProps & React.RefAttributes<HTMLHeadingElement>>;
  };
}
