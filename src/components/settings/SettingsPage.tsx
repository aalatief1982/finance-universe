// SettingsPage.tsx 
// (This shows how you could use all these components together)
import React from 'react';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import ThemeSettings from '@/components/settings/ThemeSettings';
import CurrencySettings from '@/components/settings/CurrencySettings';
import NotificationSettings from '@/components/settings/NotificationSettings';
import DataManagementSettings from '@/components/settings/DataManagementSettings';
import PrivacySettings from '@/components/settings/PrivacySettings';

const Settings = () => {
  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        
        <div className="grid grid-cols-1 gap-6">
          <ThemeSettings />
          <CurrencySettings />
          <NotificationSettings />
          <DataManagementSettings />
          <PrivacySettings />
        </div>
      </motion.div>
    </Layout>
  );
};

export default Settings;
