
import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { smsPermissionService } from '@/services/SmsPermissionService';
import { permissionEventManager } from '@/utils/permission-events';
import {
  getPermissionState,
  updatePermissionStatus,
  addSkippedPermission,
  markOnboardingCompleted,
  type PermissionState,
} from '@/utils/permission-flow-storage';

export interface PermissionFlowState {
  currentStep: 'intro' | 'sms' | 'notifications' | 'complete';
  permissionState: PermissionState;
  isAndroid: boolean;
  isLoading: boolean;
  error: string | null;
}

export const usePermissionFlow = () => {
  const [state, setState] = useState<PermissionFlowState>({
    currentStep: 'intro',
    permissionState: getPermissionState(),
    isAndroid: Capacitor.getPlatform() === 'android',
    isLoading: false,
    error: null,
  });

  useEffect(() => {
    setState(prev => ({
      ...prev,
      permissionState: getPermissionState(),
    }));
  }, []);

  // Listen for permission events to update state
  useEffect(() => {
    const unsubscribeSms = permissionEventManager.subscribe('sms-permission-changed', (event) => {
      setState(prev => ({
        ...prev,
        permissionState: getPermissionState(),
        isLoading: false,
        error: event.status === 'never-ask-again' ? 'Permission permanently denied' : null,
      }));
    });

    const unsubscribeNotifications = permissionEventManager.subscribe('notifications-permission-changed', (event) => {
      setState(prev => ({
        ...prev,
        permissionState: getPermissionState(),
        isLoading: false,
        error: event.status === 'never-ask-again' ? 'Permission permanently denied' : null,
      }));
    });

    return () => {
      unsubscribeSms();
      unsubscribeNotifications();
    };
  }, []);

  const nextStep = () => {
    setState(prev => {
      const steps = ['intro', 'sms', 'notifications', 'complete'] as const;
      const currentIndex = steps.indexOf(prev.currentStep);
      const nextIndex = Math.min(currentIndex + 1, steps.length - 1);
      return { ...prev, currentStep: steps[nextIndex] };
    });
  };

  const skipStep = (permission: string) => {
    addSkippedPermission(permission);
    setState(prev => ({ 
      ...prev, 
      permissionState: getPermissionState(),
      isLoading: false,
      error: null 
    }));
    nextStep();
  };

  const requestSmsPermission = async () => {
    if (!state.isAndroid) {
      nextStep();
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      updatePermissionStatus('sms', { 
        requested: true, 
        requestedAt: new Date().toISOString() 
      });

      // Check if we can request permission
      const canRequest = await smsPermissionService.canRequestPermission();
      if (!canRequest) {
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: 'SMS permission was permanently denied. Please enable it manually in device settings.' 
        }));
        updatePermissionStatus('sms', { granted: false });
        
        // Still move to next step after showing error
        setTimeout(() => {
          nextStep();
        }, 2000);
        return;
      }

      const granted = await smsPermissionService.requestPermission();
      
      updatePermissionStatus('sms', { 
        granted, 
        grantedAt: granted ? new Date().toISOString() : undefined 
      });

      if (!granted) {
        const status = smsPermissionService.getPermissionStatus();
        if (status === 'never-ask-again') {
          setState(prev => ({ 
            ...prev, 
            isLoading: false, 
            error: 'SMS permission was permanently denied. You can enable it manually in device settings.' 
          }));
        } else {
          setState(prev => ({ 
            ...prev, 
            isLoading: false, 
            error: 'SMS permission was denied. You can try again later.' 
          }));
        }
      }

      // Move to next step after a brief delay
      setTimeout(() => {
        nextStep();
      }, granted ? 100 : 2000);

    } catch (error) {
      console.error('SMS permission request failed:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: 'Failed to request SMS permission. Please try again.' 
      }));
      
      updatePermissionStatus('sms', { granted: false });
      
      // Still move to next step after error
      setTimeout(() => {
        nextStep();
      }, 2000);
    }
  };

  const requestNotificationPermission = async () => {
    if (!state.isAndroid) {
      nextStep();
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      updatePermissionStatus('notifications', { 
        requested: true, 
        requestedAt: new Date().toISOString() 
      });

      const status = await LocalNotifications.requestPermissions();
      const granted = status.display === 'granted';
      
      updatePermissionStatus('notifications', { 
        granted, 
        grantedAt: granted ? new Date().toISOString() : undefined 
      });

      // Emit notification permission event
      permissionEventManager.emit('notifications-permission-changed', granted, granted ? 'granted' : 'denied');

      if (!granted) {
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: 'Notification permission was denied.' 
        }));
      }

      setTimeout(() => {
        nextStep();
      }, granted ? 100 : 2000);

    } catch (error) {
      console.error('Notification permission request failed:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: 'Failed to request notification permission' 
      }));
      
      updatePermissionStatus('notifications', { granted: false });
      setTimeout(() => {
        nextStep();
      }, 2000);
    }
  };

  const completeOnboarding = () => {
    markOnboardingCompleted();
    setState(prev => ({ ...prev, permissionState: getPermissionState() }));
  };

  const resetError = () => {
    setState(prev => ({ ...prev, error: null }));
  };

  return {
    state,
    nextStep,
    skipStep,
    requestSmsPermission,
    requestNotificationPermission,
    completeOnboarding,
    resetError,
  };
};
