import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ResponsiveFABProps {
  onClick: () => void;
}

const ResponsiveFAB: React.FC<ResponsiveFABProps> = ({ onClick }) => (
  <Button
    onClick={onClick}
    size="icon"
    className="md:hidden fixed bottom-16 right-4 z-40 h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg"
    aria-label="Add Transaction"
  >
    <Plus className="h-5 w-5" />
  </Button>
);

export default ResponsiveFAB;
