
import React from 'react';
import WireframeButton from '../../WireframeButton';
import { Plus, BarChart, MessageSquare, Settings } from 'lucide-react';

interface ActionButtonsProps {
  onAddTransaction: () => void;
  onReports: () => void;
  onImportSms: () => void;
  onSettings: () => void;
}

const ActionButtons = ({ 
  onAddTransaction, 
  onReports, 
  onImportSms, 
  onSettings 
}: ActionButtonsProps) => {
  return (
    <div className="flex space-x-2">
      <WireframeButton 
        onClick={onAddTransaction}
        variant="primary"
      >
        <div className="flex items-center justify-center">
          <Plus size={18} className="mr-1" />
          <span>Add Transaction</span>
        </div>
      </WireframeButton>
      
      <button 
        className="p-2 bg-gray-200 rounded-lg"
        onClick={onReports}
      >
        <BarChart size={20} />
      </button>
      
      <button 
        className="p-2 bg-gray-200 rounded-lg"
        onClick={onImportSms}
      >
        <MessageSquare size={20} />
      </button>
      
      <button 
        className="p-2 bg-gray-200 rounded-lg" 
        onClick={onSettings}
      >
        <Settings size={20} />
      </button>
    </div>
  );
};

export default ActionButtons;
