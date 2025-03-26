
import React from 'react';

interface WireframeButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  onClick?: () => void;
}

const WireframeButton = ({ 
  children, 
  variant = 'primary', 
  onClick 
}: WireframeButtonProps) => {
  const baseClasses = "py-2 px-4 rounded-lg text-center font-semibold transition-colors";
  const variantClasses = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-gray-200 text-black hover:bg-gray-300"
  };

  return (
    <button 
      className={`${baseClasses} ${variantClasses[variant]} w-full`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export default WireframeButton;
