
import React from 'react';
import { ChevronRight } from 'lucide-react';

interface WireframeHeaderProps {
  title: string;
  onBack?: () => void;
}

const WireframeHeader = ({ title, onBack }: WireframeHeaderProps) => (
  <div className="flex items-center bg-blue-600 text-white p-3 rounded-t-lg mb-4">
    {onBack && (
      <button onClick={onBack} className="mr-2">
        <ChevronRight className="transform rotate-180" size={24} />
      </button>
    )}
    <div className="flex-grow text-center font-bold">{title}</div>
  </div>
);

export default WireframeHeader;
