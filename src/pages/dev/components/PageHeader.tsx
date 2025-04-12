
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Trash2, BrainCircuit } from 'lucide-react';

interface PageHeaderProps {
  clearLearningEntriesHandler: () => void;
}

const PageHeader: React.FC<PageHeaderProps> = ({ clearLearningEntriesHandler }) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
      <h1 className="text-2xl font-bold">Learning Engine Tester</h1>
      <div className="flex gap-2">
        <Link to="/mastermind">
          <Button 
            variant="outline" 
            size="sm"
            className="w-full sm:w-auto text-sm flex items-center gap-2"
          >
            <BrainCircuit className="h-4 w-4" />
            View MasterMind
          </Button>
        </Link>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={clearLearningEntriesHandler}
          className="w-full sm:w-auto text-sm flex items-center gap-2"
        >
          <Trash2 className="h-4 w-4" />
          Clear Memory
        </Button>
      </div>
    </div>
  );
};

export default PageHeader;
