import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LoadingOverlayProps {
  isOpen: boolean;
  message?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ isOpen, message = 'Loading...' }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
        >
          <div className="flex flex-col items-center gap-3 p-6 rounded-lg bg-card border shadow-lg">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">{message}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export { LoadingOverlay };
