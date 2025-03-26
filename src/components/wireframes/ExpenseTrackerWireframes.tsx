
import React, { useState } from 'react';
import OnboardingScreen from './screens/OnboardingScreen';
import SMSProviderScreen from './screens/SMSProviderScreen';
import DashboardScreen from './screens/DashboardScreen';
import AddTransactionScreen from './screens/AddTransactionScreen';
import ReportsScreen from './screens/ReportsScreen';
import SettingsScreen from './screens/SettingsScreen';

// Simple state management for the wireframes
interface UserData {
  name?: string;
  email?: string;
  phone?: string;
  smsProviders?: string[];
}

const ExpenseTrackerWireframes = () => {
  const [currentScreen, setCurrentScreen] = useState('onboarding');
  const [userData, setUserData] = useState<UserData>({});

  const handleUpdateUserData = (data: Partial<UserData>) => {
    setUserData((prev) => ({ ...prev, ...data }));
  };

  const screens: {[key: string]: JSX.Element} = {
    onboarding: (
      <OnboardingScreen 
        onNext={() => setCurrentScreen('smsProvider')} 
        userData={userData}
        onUpdateUserData={handleUpdateUserData}
      />
    ),
    smsProvider: (
      <SMSProviderScreen 
        onNext={() => setCurrentScreen('dashboard')}
        userData={userData}
        onUpdateUserData={handleUpdateUserData}
      />
    ),
    dashboard: (
      <DashboardScreen 
        onAddTransaction={() => setCurrentScreen('addTransaction')}
        onReports={() => setCurrentScreen('reports')}
        userData={userData}
      />
    ),
    addTransaction: <AddTransactionScreen onCancel={() => setCurrentScreen('dashboard')} />,
    reports: <ReportsScreen />,
    settings: <SettingsScreen />
  };

  return (
    <div className="flex flex-col items-center p-4 bg-gray-50">
      <h1 className="text-2xl font-bold mb-4">Expense Tracker Wireframes</h1>
      <div className="flex flex-wrap justify-center gap-2 mb-4">
        {Object.keys(screens).map(screen => (
          <button 
            key={screen}
            onClick={() => setCurrentScreen(screen)}
            className={`px-4 py-2 rounded ${
              currentScreen === screen 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200'
            }`}
          >
            {screen.charAt(0).toUpperCase() + screen.slice(1)}
          </button>
        ))}
      </div>
      {screens[currentScreen]}
    </div>
  );
};

export default ExpenseTrackerWireframes;
