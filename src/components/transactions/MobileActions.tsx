
import React from 'react';
import { Plus, Filter, FileDown, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Link } from 'react-router-dom';

interface MobileActionsProps {
  onAddTransaction: () => void;
  onToggleFilters: () => void;
  filtersVisible: boolean;
}

const MobileActions: React.FC<MobileActionsProps> = ({
  onAddTransaction,
  onToggleFilters,
  filtersVisible
}) => {
  return (
    <div className="fixed bottom-4 right-4 flex flex-col gap-2 sm:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <Button size="icon" className="rounded-full h-12 w-12 shadow-lg">
            <Plus size={24} />
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="rounded-t-xl">
          <div className="py-4 px-2">
            <h3 className="text-lg font-medium mb-4">Transaction Actions</h3>
            <div className="grid grid-cols-3 gap-4">
              <Button 
                variant="outline" 
                className="flex flex-col items-center justify-center h-20 gap-1"
                onClick={onAddTransaction}
              >
                <Plus />
                <span className="text-xs">Add</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="flex flex-col items-center justify-center h-20 gap-1"
                onClick={onToggleFilters}
              >
                <Filter />
                <span className="text-xs">{filtersVisible ? 'Hide Filters' : 'Filters'}</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="flex flex-col items-center justify-center h-20 gap-1"
                asChild
              >
                <Link to="/process-sms">
                  <MessageSquare />
                  <span className="text-xs">Import SMS</span>
                </Link>
              </Button>
              
              <Button 
                variant="outline" 
                className="flex flex-col items-center justify-center h-20 gap-1"
              >
                <FileDown />
                <span className="text-xs">Export</span>
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default MobileActions;
