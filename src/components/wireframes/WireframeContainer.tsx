
import React from 'react';

interface WireframeContainerProps {
  children: React.ReactNode;
}

const WireframeContainer = ({ children }: WireframeContainerProps) => (
  <div className="bg-gray-100 w-80 h-[640px] border-4 border-black rounded-2xl p-2 flex flex-col overflow-auto">
    {children}
  </div>
);

export default WireframeContainer;
