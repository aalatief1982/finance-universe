
import React, { useState, useEffect } from 'react';
import { Brain, Trash2, Database, Settings2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useLearningEngine } from '@/hooks/useLearningEngine';
import { useToast } from '@/components/ui/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const LearningEngineSettings = () => {
  const { config, updateConfig, getLearnedEntries, clearLearnedEntries } = useLearningEngine();
  const { toast } = useToast();
  const [learnedEntryCount, setLearnedEntryCount] = useState(0);
  const [sliderValue, setSliderValue] = useState(config.minConfidenceThreshold * 100);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    // Get the count of learned entries
    const entries = getLearnedEntries();
    setLearnedEntryCount(entries.length);
    
    // Initialize slider with config value
    setSliderValue(config.minConfidenceThreshold * 100);
  }, [getLearnedEntries, config.minConfidenceThreshold]);

  const handleThresholdChange = (value: number[]) => {
    setSliderValue(value[0]);
  };

  const handleThresholdCommit = () => {
    // Update config with new threshold value
    updateConfig({ minConfidenceThreshold: sliderValue / 100 });
    
    toast({
      title: "Settings updated",
      description: `Match confidence threshold set to ${sliderValue}%`,
    });
  };

  const handleToggleEngine = (enabled: boolean) => {
    updateConfig({ enabled });
    
    toast({
      title: enabled ? "Learning engine enabled" : "Learning engine disabled",
      description: enabled 
        ? "The app will now learn from your transactions" 
        : "The app will no longer learn from your transactions",
    });
  };

  const handleToggleAutoSave = (enabled: boolean) => {
    updateConfig({ saveAutomatically: enabled });
    
    toast({
      title: "Setting updated",
      description: enabled 
        ? "Transactions will be automatically saved for learning" 
        : "You'll be asked before saving transactions for learning",
    });
  };

  const handleClearLearning = () => {
    clearLearnedEntries();
    setLearnedEntryCount(0);
    setIsDialogOpen(false);
    
    toast({
      title: "Learning data cleared",
      description: "All learned transaction patterns have been deleted",
    });
  };

  return (
    <>
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Smart Learning Engine
        </CardTitle>
        <CardDescription>
          Customize how the app learns from your transaction patterns
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base">Enable Learning Engine</Label>
            <p className="text-sm text-muted-foreground">
              Let the app learn from your transaction patterns
            </p>
          </div>
          <Switch
            checked={config.enabled}
            onCheckedChange={handleToggleEngine}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base">Auto-Save Patterns</Label>
            <p className="text-sm text-muted-foreground">
              Automatically save transaction patterns for learning
            </p>
          </div>
          <Switch
            checked={config.saveAutomatically}
            onCheckedChange={handleToggleAutoSave}
            disabled={!config.enabled}
          />
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label className="text-base">Match Confidence Threshold</Label>
            <span className="text-sm font-medium">{sliderValue}%</span>
          </div>
          <Slider
            value={[sliderValue]}
            min={50}
            max={95}
            step={5}
            disabled={!config.enabled}
            onValueChange={handleThresholdChange}
            onValueCommit={handleThresholdCommit}
          />
          <p className="text-sm text-muted-foreground">
            Minimum confidence level required for pattern matching
          </p>
        </div>
        
        <div className="rounded-md border p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-muted-foreground" />
              <div>
                <h4 className="font-medium">Learned Patterns</h4>
                <p className="text-sm text-muted-foreground">
                  {learnedEntryCount} pattern{learnedEntryCount !== 1 ? 's' : ''} stored
                </p>
              </div>
            </div>
            
            <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-red-500 gap-1">
                  <Trash2 className="h-4 w-4" />
                  <span>Clear Data</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear learning data?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will delete all learned transaction patterns. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleClearLearning}
                    className="bg-red-500 hover:bg-red-600"
                  >
                    Clear Data
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <div className="pt-2 text-xs text-muted-foreground flex items-start gap-1">
          <Settings2 className="h-3 w-3 mt-0.5" />
          <p>
            All learning data is stored locally on your device and never synchronized to the cloud.
            This maintains your privacy while still improving over time.
          </p>
        </div>
      </CardContent>
    </Card>

    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings2 className="h-5 w-5" />
          Custom Parsing Rules
        </CardTitle>
        <CardDescription>Define your own message parsing rules</CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild className="w-full">
          <Link to="/custom-parsing-rules">Manage Rules</Link>
        </Button>
      </CardContent>
    </Card>
    </>
  );
};

export default LearningEngineSettings;
