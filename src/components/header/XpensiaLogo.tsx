
import React, { useState } from 'react';

interface XpensiaLogoProps {
  className?: string;
}

export const XpensiaLogo: React.FC<XpensiaLogoProps> = ({ className = "h-8 w-8" }) => {
  const [imageError, setImageError] = useState(false);
  
  return (
    <div className={`rounded-lg bg-primary overflow-hidden flex items-center justify-center ${className}`}>
      {imageError ? (
        <span className="text-white font-semibold text-lg">X</span>
      ) : (
        <img 
          src="/xpensia-logo.png" 
          alt="Xpensia Logo" 
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      )}
    </div>
  );
};
