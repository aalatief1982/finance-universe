import React, { useState } from 'react';
import WireframeContainer from '../WireframeContainer';
import WireframeHeader from '../WireframeHeader';
import WireframeButton from '../WireframeButton';
import { Bell, Lock, CreditCard, HelpCircle, LogOut, Moon, User, MessageSquare } from 'lucide-react';

interface UserData {
  name?: string;
  email?: string;
  phone?: string;
  smsProviders?: string[];
}

interface SettingsScreenProps {
  onBack: () => void;
  userData: UserData;
  onUpdateUserData: (data: Partial<UserData>) => void;
}

const SettingsScreen = ({ onBack, userData, onUpdateUserData }: SettingsScreenProps) => {
  const [darkMode, setDarkMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    // Update user preferences when toggling dark mode
    onUpdateUserData({ 
      preferences: { 
        theme: darkMode ? 'light' : 'dark',
        notifications: notificationsEnabled 
      } 
    });
  };
  
  const toggleNotifications = () => {
    setNotificationsEnabled(!notificationsEnabled);
    // Update user preferences when toggling notifications
    onUpdateUserData({ 
      preferences: { 
        theme: darkMode ? 'dark' : 'light',
        notifications: !notificationsEnabled 
      } 
    });
  };
  
  const settingsSections = [
    {
      title: 'Account',
      items: [
        { icon: <User size={20} />, label: 'Profile Information', action: () => {} },
        { icon: <Lock size={20} />, label: 'Security & Privacy', action: () => {} },
        { icon: <CreditCard size={20} />, label: 'Payment Methods', action: () => {} },
      ]
    },
    {
      title: 'Preferences',
      items: [
        { 
          icon: <Bell size={20} />, 
          label: 'Notifications', 
          action: toggleNotifications,
          toggle: true,
          toggled: notificationsEnabled
        },
        { 
          icon: <Moon size={20} />, 
          label: 'Dark Mode', 
          action: toggleDarkMode,
          toggle: true,
          toggled: darkMode
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
  ];
  
  return (
    <WireframeContainer>
      <WireframeHeader title="Settings" />
      
      <div className="space-y-6">
        {settingsSections.map(section => (
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
                  
                  {item.toggle && (
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
                  )}
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
