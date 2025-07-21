
import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { smsPermissionService } from '@/services/SmsPermissionService';
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
    setState(prev => ({ ...prev, permissionState: getPermissionState() }));
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

      const granted = await smsPermissionService.requestPermission();
      
      updatePermissionStatus('sms', { 
        granted, 
        grantedAt: granted ? new Date().toISOString() : undefined 
      });

      setState(prev => ({ 
        ...prev, 
        permissionState: getPermissionState(),
        isLoading: false 
      }));

      nextStep();
    } catch (error) {
      console.error('SMS permission request failed:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: 'Failed to request SMS permission' 
      }));
      
      updatePermissionStatus('sms', { granted: false });
      nextStep();
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

      setState(prev => ({ 
        ...prev, 
        permissionState: getPermissionState(),
        isLoading: false 
      }));

      nextStep();
    } catch (error) {
      console.error('Notification permission request failed:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: 'Failed to request notification permission' 
      }));
      
      updatePermissionStatus('notifications', { granted: false });
      nextStep();
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
