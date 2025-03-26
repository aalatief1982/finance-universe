
import React from 'react';
import { LayoutGrid, Table as TableIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ViewToggleProps {
  viewMode: 'grid' | 'table';
  setViewMode: (mode: 'grid' | 'table') => void;
}

const ViewToggle: React.FC<ViewToggleProps> = ({ viewMode, setViewMode }) => {
  return (
    <div className="border rounded-md p-1 hidden sm:flex">
      <Button
        variant={viewMode === 'grid' ? 'default' : 'ghost'}
        size="icon"
        className="h-8 w-8"
        onClick={() => setViewMode('grid')}
      >
        <LayoutGrid size={16} />
      </Button>
      <Button
        variant={viewMode === 'table' ? 'default' : 'ghost'}
        size="icon"
        className="h-8 w-8"
        onClick={() => setViewMode('table')}
      >
        <TableIcon size={16} />
      </Button>
    </div>
  );
};

export default ViewToggle;
