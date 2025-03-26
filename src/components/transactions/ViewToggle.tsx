
import React from 'react';
import { LayoutGrid, Table as TableIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ViewToggleProps {
  viewMode: 'grid' | 'table';
  setViewMode: (mode: 'grid' | 'table') => void;
}

const ViewToggle: React.FC<ViewToggleProps> = ({ viewMode, setViewMode }) => {
  return (
    <TooltipProvider>
      <div className="border rounded-md p-1 hidden sm:flex">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
            >
              <LayoutGrid size={16} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Grid view</TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode('table')}
              aria-label="Table view"
            >
              <TableIcon size={16} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Table view</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};

export default ViewToggle;
