
declare module 'framer-motion' {
  import { ComponentType, ReactElement, RefObject, FC } from 'react';

  export interface AnimationProps {
    animate?: any;
    initial?: any;
    exit?: any;
    transition?: any;
    variants?: any;
    whileHover?: any;
    whileTap?: any;
    whileFocus?: any;
    whileDrag?: any;
    layout?: boolean | string;
    layoutId?: string;
    onAnimationComplete?: () => void;
    onAnimationStart?: () => void;
    style?: any;
  }

  export interface MotionProps extends AnimationProps {
    children?: React.ReactNode;
    className?: string;
    onClick?: (e: any) => void;
    onMouseEnter?: (e: any) => void;
    onMouseLeave?: (e: any) => void;
  }

  export type MotionComponent<T extends React.ElementType> = React.FC<React.ComponentPropsWithoutRef<T> & AnimationProps>;

  export const motion: {
    div: MotionComponent<'div'>;
    button: MotionComponent<'button'>;
    span: MotionComponent<'span'>;
    p: MotionComponent<'p'>;
    a: MotionComponent<'a'>;
    ul: MotionComponent<'ul'>;
    li: MotionComponent<'li'>;
    section: MotionComponent<'section'>;
    header: MotionComponent<'header'>;
    footer: MotionComponent<'footer'>;
    main: MotionComponent<'main'>;
    nav: MotionComponent<'nav'>;
    aside: MotionComponent<'aside'>;
    article: MotionComponent<'article'>;
    h1: MotionComponent<'h1'>;
    h2: MotionComponent<'h2'>;
    h3: MotionComponent<'h3'>;
    h4: MotionComponent<'h4'>;
    h5: MotionComponent<'h5'>;
    h6: MotionComponent<'h6'>;
    img: MotionComponent<'img'>;
    svg: MotionComponent<'svg'>;
    path: MotionComponent<'path'>;
    circle: MotionComponent<'circle'>;
    rect: MotionComponent<'rect'>;
    form: MotionComponent<'form'>;
    input: MotionComponent<'input'>;
    textarea: MotionComponent<'textarea'>;
    select: MotionComponent<'select'>;
    option: MotionComponent<'option'>;
    label: MotionComponent<'label'>;
    table: MotionComponent<'table'>;
    tr: MotionComponent<'tr'>;
    td: MotionComponent<'td'>;
    th: MotionComponent<'th'>;
    thead: MotionComponent<'thead'>;
    tbody: MotionComponent<'tbody'>;
    tfoot: MotionComponent<'tfoot'>;
  };

  export interface AnimatePresenceProps {
    children?: React.ReactNode;
    exitBeforeEnter?: boolean;
    initial?: boolean;
    onExitComplete?: () => void;
    custom?: any;
  }

  export const AnimatePresence: FC<AnimatePresenceProps>;

  export function useAnimation(): any;
  export function useCycle<T>(...args: T[]): [T, (next?: number) => void];
  export function useMotionValue(initial: number): any;
  export function useTransform<T>(value: any, input: any[], output: T[]): any;
  export function useViewportScroll(): { scrollX: any; scrollY: any; scrollXProgress: any; scrollYProgress: any };
}
