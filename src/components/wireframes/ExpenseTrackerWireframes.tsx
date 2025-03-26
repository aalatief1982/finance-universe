
import React, { useState } from 'react';
import OnboardingScreen from './screens/OnboardingScreen';
import DashboardScreen from './screens/DashboardScreen';
import AddTransactionScreen from './screens/AddTransactionScreen';
import ReportsScreen from './screens/ReportsScreen';
import SettingsScreen from './screens/SettingsScreen';
import SMSProviderScreen from './screens/SMSProviderScreen';
import SMSTransactionScreen from './screens/SMSTransactionScreen';

interface UserData {
  name?: string;
  email?: string;
  phone?: string;
  smsProviders?: string[];
  preferences?: {
    theme?: 'light' | 'dark' | 'system';
    notifications?: boolean;
  };
}

const ExpenseTrackerWireframes = () => {
  const [userData, setUserData] = useState<UserData>({});

  const handleUpdateUserData = (data: Partial<UserData>) => {
    setUserData(prev => ({ ...prev, ...data }));
  };

  const [activeScreen, setActiveScreen] = useState<
    | 'onboarding'
    | 'dashboard'
    | 'add-transaction'
    | 'reports'
    | 'sms-provider'
    | 'sms-transaction'
    | 'settings'
  >('onboarding');

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
          onNext={() => setActiveScreen('dashboard')}
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
          onSave={() => setActiveScreen('dashboard')}
          onCancel={() => setActiveScreen('dashboard')}
        />
      )}

      {activeScreen === 'reports' && (
        <ReportsScreen
          onExportReport={() => alert('Report exported!')}
          onBack={() => setActiveScreen('dashboard')}
        />
      )}

      {activeScreen === 'sms-provider' && (
        <SMSProviderScreen
          onNext={() => setActiveScreen('dashboard')}
          onComplete={(providers) => {
            handleUpdateUserData({ smsProviders: providers });
            setActiveScreen('sms-transaction');
          }}
          onSkip={() => setActiveScreen('dashboard')}
          userData={userData}
          onUpdateUserData={handleUpdateUserData}
        />
      )}

      {activeScreen === 'sms-transaction' && (
        <SMSTransactionScreen
          onComplete={() => setActiveScreen('dashboard')}
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
