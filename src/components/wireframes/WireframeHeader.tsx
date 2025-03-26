
import React from 'react';
import { ChevronRight } from 'lucide-react';

interface WireframeHeaderProps {
  title: string;
  onBack?: () => void;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
}

const WireframeHeader = ({ title, onBack, leftElement, rightElement }: WireframeHeaderProps) => (
  <div className="flex items-center bg-blue-600 text-white p-3 rounded-t-lg mb-4">
    {leftElement ? (
      leftElement
    ) : onBack ? (
      <button onClick={onBack} className="mr-2">
        <ChevronRight className="transform rotate-180" size={24} />
      </button>
    ) : (
      <div className="w-6"></div>
    )}
    <div className="flex-grow text-center font-bold">{title}</div>
    {rightElement ? rightElement : <div className="w-6"></div>}
  </div>
);

export default WireframeHeader;
