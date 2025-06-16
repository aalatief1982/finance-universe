
import React, { useState } from 'react';
import { Image, ImageOff } from 'lucide-react';

interface XpensiaLogoProps {
  className?: string;
}

export const XpensiaLogo: React.FC<XpensiaLogoProps> = ({ className = "h-8 w-8" }) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const handleImageLoad = () => {
    setIsLoading(false);
  };
  
  const handleImageError = () => {
    setImageError(true);
    setIsLoading(false);
  };
  
  return (
    <div className={`rounded-lg bg-primary overflow-hidden flex items-center justify-center flex-shrink-0 ${className}`}>
      {imageError ? (
        <span className="text-white font-semibold text-lg">X</span>
      ) : (
        <>
          {isLoading && (
            <span className="text-white font-semibold text-lg">X</span>
          )}
          <img 
            src="/xpensia-icon.png" 
            alt="Xpensia Logo" 
            className={`w-full h-full object-cover transition-opacity duration-300 ${isLoading ? 'opacity-0 absolute' : 'opacity-100'}`}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        </>
      )}
    </div>
  );
};
