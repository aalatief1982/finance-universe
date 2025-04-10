
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BrandTelegram, AlertTriangle, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useUser } from '@/context/UserContext';
import { useLearningEngine } from '@/hooks/useLearningEngine';

const TelegramBotSetup: React.FC = () => {
  const [botToken, setBotToken] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [enableLearning, setEnableLearning] = useState(true);
  const { toast } = useToast();
  const { user, updateUser } = useUser();
  const { config, updateConfig } = useLearningEngine();

  const handleConnect = () => {
    // For demonstration, simulate connecting to Telegram
    setIsConnecting(true);
    
    setTimeout(() => {
      setIsConnecting(false);
      setIsConnected(true);
      
      // Save the bot token to user context
      if (user) {
        updateUser({
          ...user,
          telegramConnected: true,
          telegramBotToken: botToken
        });
      }
      
      // Update learning engine config
      updateConfig({
        enabled: enableLearning
      });
      
      toast({
        title: "Telegram connected",
        description: "Your Telegram bot is now set up and ready to receive transaction messages.",
      });
    }, 2000);
  };

  const handleDisconnect = () => {
    // For demonstration, simulate disconnecting from Telegram
    setIsConnecting(true);
    
    setTimeout(() => {
      setIsConnecting(false);
      setIsConnected(false);
      setBotToken('');
      
      // Remove the bot token from user context
      if (user) {
        updateUser({
          ...user,
          telegramConnected: false,
          telegramBotToken: ''
        });
      }
      
      toast({
        title: "Telegram disconnected",
        description: "Your Telegram bot has been disconnected.",
      });
    }, 1000);
  };

  // Check if user already has Telegram connected
  React.useEffect(() => {
    if (user?.telegramConnected && user?.telegramBotToken) {
      setBotToken(user.telegramBotToken);
      setIsConnected(true);
    }
  }, [user]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-4 border rounded-lg space-y-6"
    >
      <div className="flex items-center gap-2 mb-2">
        <BrandTelegram className="text-primary h-5 w-5" />
        <h3 className="text-lg font-medium">Telegram Bot Setup</h3>
      </div>
      
      {!isConnected ? (
        <>
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="bot-token" className="text-sm font-medium">
                Telegram Bot Token
              </label>
              <Input
                id="bot-token"
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
                placeholder="Enter your Telegram bot token"
                type="password"
              />
              <p className="text-xs text-muted-foreground">
                You can create a new bot and get its token via BotFather on Telegram.
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="enable-learning"
                checked={enableLearning}
                onCheckedChange={setEnableLearning}
              />
              <Label htmlFor="enable-learning" className="text-sm flex items-center">
                <Brain className="h-4 w-4 mr-1" />
                Enable smart learning from messages
              </Label>
            </div>
            
            <Button
              onClick={handleConnect}
              disabled={!botToken || isConnecting}
              className="w-full"
            >
              {isConnecting ? 'Connecting...' : 'Connect to Telegram'}
            </Button>
          </div>
          
          <div className="text-xs text-muted-foreground border-t pt-4">
            <div className="flex items-start gap-1">
              <AlertTriangle className="text-amber-500 h-4 w-4 flex-shrink-0 mt-0.5" />
              <p>
                Create a new bot on Telegram by messaging @BotFather and following the
                instructions. After setup, forward your bank messages to this bot.
              </p>
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-md">
            <p className="text-sm font-medium text-green-700 dark:text-green-300">
              Your Telegram bot is connected!
            </p>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              Forward your bank SMS messages to your bot to automatically import transactions.
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="enable-learning"
              checked={config.enabled}
              onCheckedChange={(checked) => updateConfig({ enabled: checked })}
            />
            <Label htmlFor="enable-learning" className="text-sm flex items-center">
              <Brain className="h-4 w-4 mr-1" />
              Smart learning is {config.enabled ? 'enabled' : 'disabled'}
            </Label>
          </div>
          
          <Button
            variant="outline"
            onClick={handleDisconnect}
            disabled={isConnecting}
            className="w-full"
          >
            Disconnect Telegram Bot
          </Button>
        </div>
      )}
    </motion.div>
  );
};

export default TelegramBotSetup;
