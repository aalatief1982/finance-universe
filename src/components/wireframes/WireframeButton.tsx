
import React from 'react';

interface WireframeButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'default' | 'small' | 'large';
  className?: string;
  children: React.ReactNode;
  type?: 'button' | 'submit' | 'reset';
}

const WireframeButton: React.FC<WireframeButtonProps> = ({
  variant = 'primary',
  size = 'default',
  className = '',
  children,
  type = 'button',
  ...props
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500';
      case 'secondary':
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200 focus:ring-gray-500';
      case 'outline':
        return 'bg-white text-gray-800 border border-gray-300 hover:bg-gray-50 focus:ring-gray-500';
      default:
        return 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'py-0.5 px-1.5 text-xs';
      case 'large':
        return 'py-2 px-4 text-base';
      default:
        return 'py-1 px-3 text-sm';
    }
  };

  return (
    <button
      type={type}
      className={`rounded-md font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed ${getVariantClasses()} ${getSizeClasses()} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default WireframeButton;
