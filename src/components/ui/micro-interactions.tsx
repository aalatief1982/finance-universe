import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface HoverLiftProps {
  children: React.ReactNode;
  className?: string;
  lift?: number;
}

const HoverLift: React.FC<HoverLiftProps> = ({ children, className, lift = 4 }) => {
  return (
    <motion.div
      className={cn('cursor-pointer', className)}
      whileHover={{ y: -lift, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
    >
      {children}
    </motion.div>
  );
};

interface PulseOnHoverProps {
  children: React.ReactNode;
  className?: string;
}

const PulseOnHover: React.FC<PulseOnHoverProps> = ({ children, className }) => {
  return (
    <motion.div
      className={cn('cursor-pointer', className)}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      {children}
    </motion.div>
  );
};

interface FloatingActionProps {
  children: React.ReactNode;
  className?: string;
}

const FloatingAction: React.FC<FloatingActionProps> = ({ children, className }) => {
  return (
    <motion.div
      className={cn(className)}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      whileHover={{ 
        scale: 1.1,
        boxShadow: "0 10px 25px rgba(0,0,0,0.2)"
      }}
      whileTap={{ scale: 0.9 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      {children}
    </motion.div>
  );
};

interface StaggeredListProps {
  children: React.ReactNode[];
  className?: string;
  staggerDelay?: number;
}

const StaggeredList: React.FC<StaggeredListProps> = ({ 
  children, 
  className, 
  staggerDelay = 0.1 
}) => {
  return (
    <motion.div 
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay
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
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
};

export { HoverLift, PulseOnHover, FloatingAction, StaggeredList };