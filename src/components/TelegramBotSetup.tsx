
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BrandTelegram, Copy, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

interface TelegramBotSetupProps {
  botUsername?: string;
  onConnect?: () => void;
}

const TelegramBotSetup: React.FC<TelegramBotSetupProps> = ({ 
  botUsername = 'FinanceExpenseBot',
  onConnect
}) => {
  const [copied, setCopied] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if user has already connected to the Telegram bot
    const connected = localStorage.getItem('telegram_bot_connected') === 'true';
    setIsConnected(connected);
  }, []);

  const handleCopyUsername = () => {
    navigator.clipboard.writeText(`@${botUsername}`);
    setCopied(true);
    
    toast({
      title: "Username copied",
      description: `@${botUsername} has been copied to your clipboard`,
    });
    
    setTimeout(() => setCopied(false), 3000);
  };

  const handleConnect = () => {
    // In a real implementation, this would connect to the Telegram bot
    // For now, we'll just simulate a connection
    localStorage.setItem('telegram_bot_connected', 'true');
    setIsConnected(true);
    
    toast({
      title: "Connected to Telegram bot",
      description: "You can now forward bank messages to the bot",
    });
    
    if (onConnect) {
      onConnect();
    }
  };

  const handleOpenTelegram = () => {
    window.open(`https://t.me/${botUsername}`, '_blank');
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BrandTelegram className="text-[#0088cc] h-5 w-5" />
          Telegram Bot Integration
        </CardTitle>
        <CardDescription>
          Connect to our Telegram bot to easily import transactions from your bank messages
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {isConnected ? (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-2"
          >
            <CheckCircle2 className="text-green-500 h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-green-700">Connected to Telegram Bot</p>
              <p className="text-sm text-green-600">
                You can now forward bank messages to <span className="font-medium">@{botUsername}</span>
              </p>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Bot Username</label>
              <div className="flex">
                <Input 
                  value={`@${botUsername}`} 
                  readOnly 
                  className="rounded-r-none"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-l-none border-l-0"
                  onClick={handleCopyUsername}
                >
                  {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            <div className="border rounded-lg p-3 space-y-3">
              <p className="text-sm font-medium">How to connect:</p>
              <ol className="text-sm space-y-2 pl-5 list-decimal">
                <li>Open Telegram and search for <span className="font-medium">@{botUsername}</span></li>
                <li>Start a conversation with the bot by clicking <span className="font-medium">Start</span></li>
                <li>Follow the instructions provided by the bot</li>
                <li>Forward your bank messages to the bot to import transactions</li>
              </ol>
            </div>
            
            <div className="flex items-start gap-2 bg-amber-50 p-3 rounded-lg border border-amber-200">
              <AlertTriangle className="text-amber-500 h-5 w-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-700">
                For your security, never share sensitive information like PINs or passwords with the bot.
                The bot only reads the transaction details from the messages you forward.
              </p>
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex gap-2">
        {isConnected ? (
          <Button
            className="w-full"
            variant="outline"
            onClick={handleOpenTelegram}
          >
            <BrandTelegram className="mr-2 h-4 w-4 text-[#0088cc]" />
            Open Telegram
          </Button>
        ) : (
          <>
            <Button
              className="flex-1"
              onClick={handleOpenTelegram}
            >
              <BrandTelegram className="mr-2 h-4 w-4" />
              Open in Telegram
            </Button>
            
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleConnect}
            >
              Connect Manually
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
};

export default TelegramBotSetup;
