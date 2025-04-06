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
    <div className={`rounded-lg bg-primary overflow-hidden flex items-center justify-center ${className}`}>
      {imageError ? (
        <div className="w-full h-full flex items-center justify-center">
          <ImageOff className="text-white w-4 h-4" />
        </div>
      ) : (
        <>
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-primary/80">
              <Image className="text-white w-4 h-4 animate-pulse" />
            </div>
          )}
          <img 
            src="/xpensia-icon.png" 
            alt="Xpensia Logo" 
            className={`w-full h-full object-cover transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        </>
      )}
    </div>
  );
};
