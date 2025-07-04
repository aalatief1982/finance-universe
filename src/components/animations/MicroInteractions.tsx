import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AnimatedButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'scale' | 'bounce' | 'pulse' | 'shake';
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  children,
  className,
  onClick,
  disabled = false,
  variant = 'scale'
}) => {
  const getVariant = () => {
    switch (variant) {
      case 'bounce':
        return {
          whileHover: { scale: 1.05, y: -2 },
          whileTap: { scale: 0.95, y: 0 }
        };
      case 'pulse':
        return {
          whileHover: { scale: 1.02 },
          whileTap: { scale: 0.98 },
          animate: { opacity: [1, 0.8, 1] },
          transition: { duration: 1.5, repeat: Infinity }
        };
      case 'shake':
        return {
          whileHover: { x: [-1, 1, -1, 1, 0] },
          whileTap: { scale: 0.95 }
        };
      default:
        return {
          whileHover: { scale: 1.02 },
          whileTap: { scale: 0.98 }
        };
    }
  };

  return (
    <motion.button
      className={cn('transition-all duration-200', className)}
      onClick={onClick}
      disabled={disabled}
      {...getVariant()}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      {children}
    </motion.button>
  );
};

interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  className,
  delay = 0
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{
        type: 'spring',
        stiffness: 260,
        damping: 20,
        delay
      }}
      whileHover={{
        y: -4,
        transition: { duration: 0.2 }
      }}
      className={cn('transition-shadow duration-200 hover:shadow-lg', className)}
    >
      {children}
    </motion.div>
  );
};

interface AnimatedListProps {
  children: React.ReactNode[];
  className?: string;
  stagger?: number;
}

export const AnimatedList: React.FC<AnimatedListProps> = ({
  children,
  className,
  stagger = 0.1
}) => {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: {
            staggerChildren: stagger
          }
        }
      }}
    >
      {children.map((child, index) => (
        <motion.div
          key={index}
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 }
          }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
};

interface SuccessAnimationProps {
  isVisible: boolean;
  children: React.ReactNode;
}

export const SuccessAnimation: React.FC<SuccessAnimationProps> = ({
  isVisible,
  children
}) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: [0, 1.1, 1],
            opacity: 1
          }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 20,
            duration: 0.6
          }}
          className="flex items-center justify-center"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

interface LoadingDotsProps {
  className?: string;
}

export const LoadingDots: React.FC<LoadingDotsProps> = ({ className }) => {
  return (
    <div className={cn('flex space-x-1', className)}>
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          className="w-2 h-2 bg-primary rounded-full"
          animate={{ y: [0, -8, 0] }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: index * 0.1
          }}
        />
      ))}
    </div>
  );
};