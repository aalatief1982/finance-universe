import React, { useState } from 'react';
import WireframeContainer from '../WireframeContainer';
import WireframeHeader from '../WireframeHeader';
import WireframeButton from '../WireframeButton';
import CurrencySelector from '../CurrencySelector';
import { Bell, Lock, CreditCard, HelpCircle, LogOut, Moon, User, MessageSquare, Sun, Globe, Shield, Database, Eye } from 'lucide-react';

interface UserData {
  name?: string;
  email?: string;
  phone?: string;
  smsProviders?: string[];
  preferences?: {
    theme?: 'light' | 'dark' | 'system';
    notifications?: boolean;
    language?: string;
    currency?: string;
    displayOptions?: {
      showCents?: boolean;
      weekStartsOn?: 'sunday' | 'monday';
      defaultView?: 'list' | 'stats' | 'calendar';
      compactMode?: boolean;
    };
    privacy?: {
      maskAmounts?: boolean;
      requireAuthForSensitiveActions?: boolean;
      dataSharing?: 'none' | 'anonymous' | 'full';
    };
    dataManagement?: {
      autoBackup?: boolean;
      backupFrequency?: 'daily' | 'weekly' | 'monthly';
      dataRetention?: '3months' | '6months' | '1year' | 'forever';
    };
  };
}

interface SettingsScreenProps {
  onBack: () => void;
  userData: UserData;
  onUpdateUserData: (data: Partial<UserData>) => void;
}

const SettingsScreen = ({ onBack, userData, onUpdateUserData }: SettingsScreenProps) => {
  const [activeTab, setActiveTab] = useState<string>('account');
  const [darkMode, setDarkMode] = useState(userData?.preferences?.theme === 'dark');
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    userData?.preferences?.notifications !== false
  );
  const [currency, setCurrency] = useState(userData?.preferences?.currency || 'USD');
  const [language, setLanguage] = useState(userData?.preferences?.language || 'en');
  const [showCents, setShowCents] = useState(
    userData?.preferences?.displayOptions?.showCents !== false
  );
  const [compactMode, setCompactMode] = useState(
    userData?.preferences?.displayOptions?.compactMode === true
  );
  const [maskAmounts, setMaskAmounts] = useState(
    userData?.preferences?.privacy?.maskAmounts === true
  );
  const [autoBackup, setAutoBackup] = useState(
    userData?.preferences?.dataManagement?.autoBackup === true
  );
  
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    // Update user preferences when toggling dark mode
    onUpdateUserData({ 
      preferences: { 
        ...userData?.preferences,
        theme: darkMode ? 'light' : 'dark',
      } 
    });
  };
  
  const toggleNotifications = () => {
    setNotificationsEnabled(!notificationsEnabled);
    // Update user preferences when toggling notifications
    onUpdateUserData({ 
      preferences: { 
        ...userData?.preferences,
        notifications: !notificationsEnabled 
      } 
    });
  };

  const handleCurrencyChange = (newCurrency: string) => {
    setCurrency(newCurrency);
    onUpdateUserData({ 
      preferences: { 
        ...userData?.preferences,
        currency: newCurrency 
      } 
    });
  };

  const toggleShowCents = () => {
    setShowCents(!showCents);
    onUpdateUserData({ 
      preferences: { 
        ...userData?.preferences,
        displayOptions: {
          ...userData?.preferences?.displayOptions,
          showCents: !showCents 
        }
      } 
    });
  };

  const toggleCompactMode = () => {
    setCompactMode(!compactMode);
    onUpdateUserData({ 
      preferences: { 
        ...userData?.preferences,
        displayOptions: {
          ...userData?.preferences?.displayOptions,
          compactMode: !compactMode 
        }
      } 
    });
  };

  const toggleMaskAmounts = () => {
    setMaskAmounts(!maskAmounts);
    onUpdateUserData({ 
      preferences: { 
        ...userData?.preferences,
        privacy: {
          ...userData?.preferences?.privacy,
          maskAmounts: !maskAmounts 
        }
      } 
    });
  };

  const toggleAutoBackup = () => {
    setAutoBackup(!autoBackup);
    onUpdateUserData({ 
      preferences: { 
        ...userData?.preferences,
        dataManagement: {
          ...userData?.preferences?.dataManagement,
          autoBackup: !autoBackup 
        }
      } 
    });
  };
  
  // Tab structure similar to main settings page
  const settingsTabs = [
    {
      id: 'account',
      label: 'Account',
      icon: <User size={16} />
    },
    {
      id: 'appearance',
      label: 'Appearance',
      icon: <Sun size={16} />
    },
    {
      id: 'display',
      label: 'Display',
      icon: <Eye size={16} />
    },
    {
      id: 'privacy',
      label: 'Privacy',
      icon: <Shield size={16} />
    },
    {
      id: 'data',
      label: 'Data',
      icon: <Database size={16} />
    }
  ];
  
  // Settings sections based on tabs for consistency with main page
  const settingsSections = {
    account: [
      {
        title: 'Account',
        items: [
          { icon: <User size={20} />, label: 'Profile Information', action: () => {} },
          { icon: <Lock size={20} />, label: 'Security & Privacy', action: () => {} },
          { icon: <CreditCard size={20} />, label: 'Payment Methods', action: () => {} },
        ]
      }
    ],
    appearance: [
      {
        title: 'Appearance',
        items: [
          { 
            icon: <Moon size={20} />, 
            label: 'Dark Mode', 
            action: toggleDarkMode,
            toggle: true,
            toggled: darkMode
          },
          { 
            icon: <Bell size={20} />, 
            label: 'Notifications', 
            action: toggleNotifications,
            toggle: true,
            toggled: notificationsEnabled
          },
          { 
            icon: <Globe size={20} />, 
            label: 'Currency', 
            action: () => {},
            custom: (
              <CurrencySelector 
                value={currency} 
                onChange={handleCurrencyChange} 
                darkMode={darkMode}
                className="ml-auto"
              />
            )
          },
        ]
      }
    ],
    display: [
      {
        title: 'Display Options',
        items: [
          { 
            icon: <Eye size={20} />, 
            label: 'Show Cents', 
            action: toggleShowCents,
            toggle: true,
            toggled: showCents
          },
          { 
            icon: <Eye size={20} />, 
            label: 'Compact Mode', 
            action: toggleCompactMode,
            toggle: true,
            toggled: compactMode
          },
        ]
      }
    ],
    privacy: [
      {
        title: 'Privacy Settings',
        items: [
          { 
            icon: <Shield size={20} />, 
            label: 'Mask Amounts', 
            action: toggleMaskAmounts,
            toggle: true,
            toggled: maskAmounts
          },
          { icon: <Lock size={20} />, label: 'Security Settings', action: () => {} },
        ]
      }
    ],
    data: [
      {
        title: 'Data Management',
        items: [
          { 
            icon: <Database size={20} />, 
            label: 'Auto Backup', 
            action: toggleAutoBackup,
            toggle: true,
            toggled: autoBackup
          },
          { icon: <MessageSquare size={20} />, label: 'SMS Providers', action: () => {} },
        ]
      },
      {
        title: 'Support',
        items: [
          { icon: <HelpCircle size={20} />, label: 'Help & Support', action: () => {} },
          { icon: <LogOut size={20} />, label: 'Log Out', action: () => {}, danger: true },
        ]
      }
    ]
  };
  
  return (
    <WireframeContainer>
      <WireframeHeader title="Settings" onBack={onBack} />
      
      {/* Tabs for settings categories */}
      <div className="flex mb-4 overflow-x-auto pb-2 -mx-1">
        {settingsTabs.map(tab => (
          <div 
            key={tab.id}
            className={`px-3 py-2 mx-1 rounded-md text-sm font-medium cursor-pointer flex items-center ${
              activeTab === tab.id 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700'
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="mr-1">{tab.icon}</span>
            <span>{tab.label}</span>
          </div>
        ))}
      </div>
      
      <div className="space-y-6 overflow-auto flex-1">
        {/* Render active tab content */}
        {settingsSections[activeTab as keyof typeof settingsSections]?.map(section => (
          <div key={section.title}>
            <h3 className="font-medium mb-2">{section.title}</h3>
            <div className="space-y-1 border rounded-lg overflow-hidden">
              {section.items.map((item, index) => (
                <div 
                  key={item.label}
                  className={`px-3 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 ${
                    index < section.items.length - 1 ? 'border-b' : ''
                  }`}
                  onClick={item.action}
                >
                  <div className="flex items-center">
                    <div className={`mr-3 ${item.danger ? 'text-red-500' : 'text-gray-500'}`}>
                      {item.icon}
                    </div>
                    <span className={item.danger ? 'text-red-500' : ''}>{item.label}</span>
                  </div>
                  
                  {item.custom ? (
                    item.custom
                  ) : item.toggle ? (
                    <div 
                      className={`w-10 h-6 rounded-full p-1 transition-colors ${
                        item.toggled ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                    >
                      <div 
                        className={`bg-white w-4 h-4 rounded-full transform transition-transform ${
                          item.toggled ? 'translate-x-4' : ''
                        }`} 
                      />
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ))}
        
        <div className="text-center text-gray-500 text-sm">
          <p>Expense Tracker v1.0.0</p>
          <p>© 2023 All Rights Reserved</p>
        </div>
      </div>
    </WireframeContainer>
  );
};

export default SettingsScreen;
