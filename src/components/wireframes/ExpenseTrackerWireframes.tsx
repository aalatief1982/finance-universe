
import React, { useState, useEffect } from 'react';
import OnboardingScreen from './screens/OnboardingScreen';
import DashboardScreen from './screens/DashboardScreen';
import AddTransactionScreen from './screens/AddTransactionScreen';
import ReportsScreen from './screens/ReportsScreen';
import SettingsScreen from './screens/SettingsScreen';
import SMSProviderScreen from './screens/SMSProviderScreen';
import SMSTransactionScreen from './screens/SMSTransactionScreen';
import { useToast } from '@/components/ui/use-toast';

interface UserData {
  name?: string;
  email?: string;
  phone?: string;
  smsProviders?: string[];
  preferences?: {
    theme?: 'light' | 'dark' | 'system';
    notifications?: boolean;
    currency?: string;
  };
  completedOnboarding?: boolean;
}

const ExpenseTrackerWireframes = () => {
  const [userData, setUserData] = useState<UserData>({});
  const { toast } = useToast();

  // Load userData from localStorage on initial render
  useEffect(() => {
    const storedUserData = localStorage.getItem('userData');
    if (storedUserData) {
      try {
        setUserData(JSON.parse(storedUserData));
      } catch (error) {
        console.error('Failed to parse stored user data', error);
      }
    }
  }, []);

  // Save userData to localStorage whenever it changes
  useEffect(() => {
    if (Object.keys(userData).length > 0) {
      localStorage.setItem('userData', JSON.stringify(userData));
    }
  }, [userData]);

  const handleUpdateUserData = (data: Partial<UserData>) => {
    setUserData(prev => {
      const updated = { ...prev, ...data };
      // Show notification when profile is updated
      if (data.name || data.email) {
        toast({
          title: "Profile updated",
          description: "Your profile information has been saved",
        });
      }
      return updated;
    });
  };

  const [activeScreen, setActiveScreen] = useState<
    | 'onboarding'
    | 'dashboard'
    | 'add-transaction'
    | 'reports'
    | 'sms-provider'
    | 'sms-transaction'
    | 'settings'
  >(userData.completedOnboarding ? 'dashboard' : 'onboarding');

  // Handle onboarding completion
  const handleCompleteOnboarding = () => {
    handleUpdateUserData({ completedOnboarding: true });
    setActiveScreen('dashboard');
    toast({
      title: "Onboarding complete",
      description: "Welcome to your personal expense tracker",
    });
  };

  const handleImportSms = () => {
    if (!userData.smsProviders || userData.smsProviders.length === 0) {
      setActiveScreen('sms-provider');
    } else {
      setActiveScreen('sms-transaction');
    }
  };

  const handleSettings = () => {
    setActiveScreen('settings');
  };

  return (
    <div className="max-w-sm mx-auto border rounded-lg overflow-hidden h-[640px] shadow-lg bg-white">
      {activeScreen === 'onboarding' && (
        <OnboardingScreen
          onNext={handleCompleteOnboarding}
          userData={userData}
          onUpdateUserData={handleUpdateUserData}
        />
      )}

      {activeScreen === 'dashboard' && (
        <DashboardScreen
          onAddTransaction={() => setActiveScreen('add-transaction')}
          onReports={() => setActiveScreen('reports')}
          onImportSms={handleImportSms}
          onSettings={handleSettings}
          userData={userData}
        />
      )}

      {activeScreen === 'add-transaction' && (
        <AddTransactionScreen
          onSave={() => {
            setActiveScreen('dashboard');
            toast({
              title: "Transaction added",
              description: "Your transaction has been saved",
            });
          }}
          onCancel={() => setActiveScreen('dashboard')}
        />
      )}

      {activeScreen === 'reports' && (
        <ReportsScreen
          onExportReport={() => {
            toast({
              title: "Report exported",
              description: "Your report has been downloaded",
            });
          }}
          onBack={() => setActiveScreen('dashboard')}
        />
      )}

      {activeScreen === 'sms-provider' && (
        <SMSProviderScreen
          onNext={() => setActiveScreen('dashboard')}
          onComplete={(providers) => {
            handleUpdateUserData({ smsProviders: providers });
            setActiveScreen('sms-transaction');
            toast({
              title: "SMS providers configured",
              description: "You can now import transactions from SMS",
            });
          }}
          onSkip={() => setActiveScreen('dashboard')}
          userData={userData}
          onUpdateUserData={handleUpdateUserData}
        />
      )}

      {activeScreen === 'sms-transaction' && (
        <SMSTransactionScreen
          onComplete={() => {
            setActiveScreen('dashboard');
            toast({
              title: "SMS transactions imported",
              description: "Your transactions have been processed",
            });
          }}
          onCancel={() => setActiveScreen('dashboard')}
        />
      )}

      {activeScreen === 'settings' && (
        <SettingsScreen
          onBack={() => setActiveScreen('dashboard')}
          userData={userData}
          onUpdateUserData={handleUpdateUserData}
        />
      )}
    </div>
  );
};

export default ExpenseTrackerWireframes;
