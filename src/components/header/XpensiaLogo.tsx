
import React from 'react';

interface XpensiaLogoProps {
  className?: string;
}

export const XpensiaLogo: React.FC<XpensiaLogoProps> = ({ className = "h-8 w-8" }) => {
  return (
    <div className={`rounded-lg bg-primary overflow-hidden flex items-center justify-center ${className}`}>
      <img 
        src="/xpensia-logo.png" 
        alt="Xpensia Logo" 
        className="w-full h-full object-cover"
      />
    </div>
  );
};
