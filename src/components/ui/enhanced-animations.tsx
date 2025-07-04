import React from 'react';
import { cn } from '@/lib/utils';

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}

const FadeIn: React.FC<FadeInProps> = ({
  children,
  delay = 0,
  duration = 300,
  className
}) => {
  return (
    <div
      className={cn('animate-fade-in', className)}
      style={{
        animationDelay: `${delay}ms`,
        animationDuration: `${duration}ms`
      }}
    >
      {children}
    </div>
  );
};

interface SlideInProps {
  children: React.ReactNode;
  direction?: 'left' | 'right' | 'up' | 'down';
  delay?: number;
  className?: string;
}

const SlideIn: React.FC<SlideInProps> = ({
  children,
  direction = 'up',
  delay = 0,
  className
}) => {
  const directionClasses = {
    left: 'animate-slide-in-left',
    right: 'animate-slide-in-right',
    up: 'animate-slide-up',
    down: 'animate-slide-down'
  };

  return (
    <div
      className={cn(directionClasses[direction], className)}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

interface StaggeredFadeInProps {
  children: React.ReactNode[];
  staggerDelay?: number;
  className?: string;
}

const StaggeredFadeIn: React.FC<StaggeredFadeInProps> = ({
  children,
  staggerDelay = 100,
  className
}) => {
  return (
    <div className={className}>
      {React.Children.map(children, (child, index) => (
        <FadeIn delay={index * staggerDelay}>
          {child}
        </FadeIn>
      ))}
    </div>
  );
};

export { FadeIn, SlideIn, StaggeredFadeIn };