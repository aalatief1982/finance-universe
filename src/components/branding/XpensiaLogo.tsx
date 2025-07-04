import React from 'react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface XpensiaLogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'text' | 'icon' | 'full';
  className?: string;
  clickable?: boolean;
  href?: string;
}

const XpensiaLogo: React.FC<XpensiaLogoProps> = ({
  size = 'md',
  variant = 'full',
  className,
  clickable = true,
  href = '/'
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          container: 'h-6',
          text: 'text-lg',
          icon: 'w-6 h-6'
        };
      case 'lg':
        return {
          container: 'h-12',
          text: 'text-3xl',
          icon: 'w-12 h-12'
        };
      default:
        return {
          container: 'h-8',
          text: 'text-xl',
          icon: 'w-8 h-8'
        };
    }
  };

  const sizes = getSizeClasses();

  const LogoIcon = () => (
    <div className={cn(
      "rounded-lg bg-gradient-primary flex items-center justify-center text-white font-bold",
      sizes.icon
    )}>
      <span className={cn("font-bold", size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-xl' : 'text-sm')}>
        X
      </span>
    </div>
  );

  const LogoText = () => (
    <span className={cn(
      "font-bold bg-gradient-primary bg-clip-text text-transparent",
      sizes.text
    )}>
      Xpensia
    </span>
  );

  const LogoContent = () => {
    switch (variant) {
      case 'icon':
        return <LogoIcon />;
      case 'text':
        return <LogoText />;
      case 'full':
      default:
        return (
          <div className="flex items-center gap-2">
            <LogoIcon />
            <LogoText />
          </div>
        );
    }
  };

  const logoElement = (
    <div className={cn(
      "flex items-center transition-opacity",
      clickable && "hover:opacity-80",
      className
    )}>
      <LogoContent />
    </div>
  );

  if (clickable) {
    return (
      <Link to={href} className="inline-flex">
        {logoElement}
      </Link>
    );
  }

  return logoElement;
};

export default XpensiaLogo;