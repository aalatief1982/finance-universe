
import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CategorySettings from '@/components/settings/CategorySettings';
import CurrencySettings from '@/components/settings/CurrencySettings';
import NotificationSettings from '@/components/settings/NotificationSettings';
import PrivacySettings from '@/components/settings/PrivacySettings';
import DataManagementSettings from '@/components/settings/DataManagementSettings';
import ThemeSettings from '@/components/settings/ThemeSettings';
import LearningEngineSettings from '@/components/settings/LearningEngineSettings';
import { motion } from 'framer-motion';
import { Lock, Unlock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

const SettingsPage = () => {
  const [betaDialogOpen, setBetaDialogOpen] = useState(false);
  const [betaCode, setBetaCode] = useState('');
  const [isBetaActive, setIsBetaActive] = useState(() => {
    return localStorage.getItem('betaFeaturesActive') === 'true';
  });
  const { toast } = useToast();

  const handleBetaCodeSubmit = () => {
    if (betaCode === '0599572215') {
      localStorage.setItem('betaFeaturesActive', 'true');
      setIsBetaActive(true);
      setBetaDialogOpen(false);
      setBetaCode('');
      toast({
        title: "🎉 Beta Features Activated!",
        description: "You now have access to all beta features including Budget and Import SMS.",
      });
    } else {
      toast({
        title: "❌ Invalid Beta Code",
        description: "Please enter a valid beta code to activate premium features.",
        variant: "destructive",
      });
      setBetaDialogOpen(false);
      setBetaCode('');
    }
  };

  const handleLockedFeatureClick = (featureName: string) => {
    toast({
      title: `🚧 ${featureName} Coming Soon!`,
      description: "This feature is currently under development. Stay tuned for exciting updates!",
    });
  };

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="container py-8 max-w-4xl mx-auto"
      >
        <h1 className="text-3xl font-bold mb-6">Settings</h1>
        
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid grid-cols-5 md:grid-cols-7 mb-8">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="learning">Learning</TabsTrigger>
            <TabsTrigger 
              value="budget" 
              className="relative"
              onClick={(e) => {
                if (!isBetaActive) {
                  e.preventDefault();
                  handleLockedFeatureClick('Budget');
                }
              }}
            >
              Budget 
              {!isBetaActive && <Lock className="h-3 w-3 ml-1" />}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="general">
            <div className="space-y-8">
              <CurrencySettings />
              <ThemeSettings />
              <PrivacySettings />
              <DataManagementSettings />
              
              {/* Beta Features Activation */}
              <div className="rounded-lg border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Beta Features</h3>
                    <p className="text-sm text-muted-foreground">
                      {isBetaActive ? 'Beta features are active' : 'Unlock exclusive beta features'}
                    </p>
                  </div>
                  {isBetaActive ? (
                    <div className="flex items-center text-green-600">
                      <Unlock className="h-4 w-4 mr-2" />
                      <span className="text-sm font-medium">Active</span>
                    </div>
                  ) : (
                    <Dialog open={betaDialogOpen} onOpenChange={setBetaDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline">
                          Activate Beta Features
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Enter Beta Code</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="betaCode">Beta Code</Label>
                            <Input
                              id="betaCode"
                              value={betaCode}
                              onChange={(e) => setBetaCode(e.target.value)}
                              placeholder="Enter your beta code"
                            />
                          </div>
                          <Button onClick={handleBetaCodeSubmit} className="w-full">
                            Activate Features
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="categories">
            <CategorySettings />
          </TabsContent>
          
          <TabsContent value="notifications">
            <NotificationSettings />
          </TabsContent>
          
          
          <TabsContent value="learning">
            <div className="relative">
              {!isBetaActive && (
                <div 
                  className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center cursor-pointer rounded-lg"
                  onClick={() => handleLockedFeatureClick('Learning Engine')}
                >
                  <div className="text-center">
                    <Lock className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Feature locked</p>
                  </div>
                </div>
              )}
              <LearningEngineSettings />
            </div>
          </TabsContent>

          {isBetaActive && (
            <TabsContent value="budget">
              <div className="text-center py-12">
                <h3 className="text-lg font-semibold mb-2">Budget Management</h3>
                <p className="text-muted-foreground">Budget features will be available here</p>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </motion.div>
    </Layout>
  );
};

export default SettingsPage;
