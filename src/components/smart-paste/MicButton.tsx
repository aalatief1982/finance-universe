import React from 'react';
import { Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/i18n/LanguageContext';

interface MicButtonProps {
  isListening: boolean;
  isSupported: boolean;
  onClick: () => void;
  size?: 'sm' | 'default' | 'icon';
  className?: string;
}

const MicButton: React.FC<MicButtonProps> = ({
  isListening,
  isSupported,
  onClick,
  size = 'icon',
  className,
}) => {
  const { t } = useLanguage();
  if (!isSupported) return null;

  return (
    <Button
      type="button"
      variant={isListening ? 'destructive' : 'outline'}
      size={size}
      onClick={onClick}
      aria-label={isListening ? t('smartEntry.mic.stop') : t('smartEntry.mic.start')}
      className={cn(
        'shrink-0 transition-all',
        isListening && 'animate-pulse',
        className,
      )}
    >
      {isListening ? (
        <MicOff className="h-4 w-4" />
      ) : (
        <Mic className="h-4 w-4" />
      )}
    </Button>
  );
};

export default MicButton;
