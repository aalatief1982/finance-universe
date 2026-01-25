import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Trash2, Download, Bug } from 'lucide-react';
import { appUpdateService, OTADebugInfo, UpdateStatus } from '@/services/AppUpdateService';
import { Capacitor } from '@capacitor/core';
import { getLastStoredError, clearStoredError } from '@/components/ErrorBoundary';

interface StoredError {
  route: string;
  boundaryName: string;
  message: string;
  stack?: string;
  timestamp: string;
}

const OTADebugSection: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<OTADebugInfo | null>(null);
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [lastError, setLastError] = useState<StoredError | null>(null);

  useEffect(() => {
    loadDebugInfo();
    setLastError(getLastStoredError());
  }, []);

  const loadDebugInfo = async () => {
    setIsLoading(true);
    try {
      const info = await appUpdateService.getDebugInfo();
      setDebugInfo(info);
    } catch (err) {
      console.error('[OTADebug] Failed to load info:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckForUpdates = async () => {
    setIsChecking(true);
    try {
      const status = await appUpdateService.manualCheckForUpdates();
      setUpdateStatus(status);
      await loadDebugInfo();
    } catch (err) {
      console.error('[OTADebug] Check failed:', err);
    } finally {
      setIsChecking(false);
    }
  };

  const handleClearPending = () => {
    appUpdateService.clearPendingBundle();
    loadDebugInfo();
  };

  const handleClearError = () => {
    clearStoredError();
    setLastError(null);
  };

  if (!Capacitor.isNativePlatform()) {
    return null; // Only show on native
  }

  return (
    <Card className="border-dashed border-amber-500/50">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Bug size={16} className="text-amber-500" />
          OTA Debug Info
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-xs">
        {isLoading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : debugInfo ? (
          <>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-muted-foreground">Native Version</p>
                <p className="font-mono font-medium">{debugInfo.nativeVersion}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Initialized</p>
                <Badge variant={debugInfo.initialized ? 'default' : 'destructive'}>
                  {debugInfo.initialized ? 'Yes' : 'No'}
                </Badge>
              </div>
            </div>

            <div>
              <p className="text-muted-foreground">Current Bundle</p>
              {debugInfo.currentBundle ? (
                <div className="font-mono text-xs bg-muted p-1 rounded mt-1">
                  ID: {debugInfo.currentBundle.id}<br />
                  Version: {debugInfo.currentBundle.version || 'N/A'}<br />
                  Status: {debugInfo.currentBundle.status || 'N/A'}
                </div>
              ) : (
                <p className="text-muted-foreground italic">None (builtin)</p>
              )}
            </div>

            <div>
              <p className="text-muted-foreground">Pending Bundle</p>
              {debugInfo.pendingBundle ? (
                <div className="flex items-center gap-2">
                  <span className="font-mono">{debugInfo.pendingBundle.version}</span>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={handleClearPending}
                    className="h-6 px-2"
                  >
                    <Trash2 size={12} />
                  </Button>
                </div>
              ) : (
                <p className="text-muted-foreground italic">None</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-muted-foreground">Last Manifest Check</p>
                <p className="font-mono text-[10px]">
                  {debugInfo.lastManifestCheck 
                    ? new Date(debugInfo.lastManifestCheck).toLocaleString()
                    : 'Never'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Last Manifest Version</p>
                <p className="font-mono">{debugInfo.lastManifestVersion || 'N/A'}</p>
              </div>
            </div>

            {debugInfo.allBundles.length > 0 && (
              <div>
                <p className="text-muted-foreground">All Bundles ({debugInfo.allBundles.length})</p>
                <div className="space-y-1 mt-1">
                  {debugInfo.allBundles.map((b, i) => (
                    <div key={i} className="font-mono text-[10px] bg-muted p-1 rounded">
                      {b.version || b.id} ({b.status || 'unknown'})
                    </div>
                  ))}
                </div>
              </div>
            )}

            {updateStatus && (
              <div className="border-t pt-2 mt-2">
                <p className="text-muted-foreground">Last Check Result</p>
                <div className="font-mono text-[10px] bg-muted p-1 rounded mt-1">
                  Available: {updateStatus.available ? 'Yes' : 'No'}<br />
                  Current: {updateStatus.currentVersion}<br />
                  {updateStatus.newVersion && <>New: {updateStatus.newVersion}<br /></>}
                  {updateStatus.requiresStoreUpdate && <span className="text-amber-500">⚠️ Store update required</span>}
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="text-muted-foreground">Failed to load debug info</p>
        )}

        {lastError && (
          <div className="border-t pt-2 mt-2">
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground">Last Error</p>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={handleClearError}
                className="h-5 px-2 text-[10px]"
              >
                Clear
              </Button>
            </div>
            <div className="font-mono text-[10px] bg-destructive/10 p-1 rounded mt-1 text-destructive">
              [{lastError.boundaryName}] {lastError.message}<br />
              <span className="text-muted-foreground">
                {lastError.route} @ {new Date(lastError.timestamp).toLocaleTimeString()}
              </span>
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleCheckForUpdates}
            disabled={isChecking}
            className="flex-1 h-8"
          >
            {isChecking ? (
              <RefreshCw size={14} className="animate-spin mr-1" />
            ) : (
              <Download size={14} className="mr-1" />
            )}
            Check Updates
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={loadDebugInfo}
            disabled={isLoading}
            className="h-8"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default OTADebugSection;
