
import React from 'react';
import Layout from '@/components/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CategorySettings from '@/components/settings/CategorySettings';
import CurrencySettings from '@/components/settings/CurrencySettings';
import NotificationSettings from '@/components/settings/NotificationSettings';
import PrivacySettings from '@/components/settings/PrivacySettings';
import DataManagementSettings from '@/components/settings/DataManagementSettings';
import ThemeSettings from '@/components/settings/ThemeSettings';
import LearningEngineSettings from '@/components/settings/LearningEngineSettings';
import { motion } from 'framer-motion';

const SettingsPage = () => {
  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="container py-8 max-w-4xl mx-auto"
      >
        <h1 className="text-3xl font-bold mb-6">Settings</h1>
        
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid grid-cols-3 md:grid-cols-7 mb-8">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="learning">Learning</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general">
            <div className="space-y-8">
              <CurrencySettings />
              <ThemeSettings />
              <PrivacySettings />
              <DataManagementSettings />
              {/* Add more general settings components as needed */}
            </div>
          </TabsContent>
          
          <TabsContent value="categories">
            <CategorySettings />
          </TabsContent>
          
          <TabsContent value="notifications">
            <NotificationSettings />
          </TabsContent>
          
          
          <TabsContent value="learning">
            <LearningEngineSettings />
          </TabsContent>
        </Tabs>
      </motion.div>
    </Layout>
  );
};

export default SettingsPage;
