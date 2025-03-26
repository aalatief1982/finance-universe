
import React from 'react';
import WireframeContainer from '../WireframeContainer';
import WireframeHeader from '../WireframeHeader';
import { Edit, ChevronRight, Trash2 } from 'lucide-react';

const SettingsScreen = () => {
  return (
    <WireframeContainer>
      <WireframeHeader title="Settings" />
      <div className="space-y-4">
        <div className="bg-white rounded-lg">
          <div className="p-3 border-b flex justify-between items-center">
            <span>Profile</span>
            <Edit className="text-blue-600" size={24} />
          </div>
          <div className="p-3 border-b flex justify-between items-center">
            <span>SMS Providers</span>
            <ChevronRight className="text-gray-500" size={24} />
          </div>
          <div className="p-3 border-b flex justify-between items-center">
            <span>Currency Preferences</span>
            <ChevronRight className="text-gray-500" size={24} />
          </div>
          <div className="p-3 flex justify-between items-center">
            <span className="text-red-600">Delete Account</span>
            <Trash2 className="text-red-600" size={24} />
          </div>
        </div>
      </div>
    </WireframeContainer>
  );
};

export default SettingsScreen;
