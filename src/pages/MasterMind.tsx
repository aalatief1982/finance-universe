
// MasterMind.tsx - UI Screen for Master Token Map
import React, { useEffect, useState } from 'react';
import { masterMindService, MasterTokenMap } from '@/services/MasterMindService';
import Layout from '@/components/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

const MasterMind: React.FC = () => {
  const [map, setMap] = useState<MasterTokenMap>({});
  const { toast } = useToast();

  useEffect(() => {
    setMap(masterMindService.getMap());
  }, []);

  const handleClear = () => {
    if (window.confirm("Are you sure you want to clear the MasterMind data?")) {
      masterMindService.clear();
      setMap({});
      toast({
        title: "MasterMind cleared",
        description: "All token mappings have been removed",
      });
    }
  };

  return (
    <Layout>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="container max-w-4xl mx-auto py-8"
      >
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">MasterMind Token Knowledge</h1>
          <Button variant="destructive" onClick={handleClear}>Clear All</Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Token Mappings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto border text-sm">
                <thead className="bg-gray-100 dark:bg-gray-800">
                  <tr>
                    <th className="px-3 py-2 text-left">Token</th>
                    <th className="px-3 py-2 text-left">Field</th>
                    <th className="px-3 py-2 text-left">Category</th>
                    <th className="px-3 py-2 text-left">Subcategory</th>
                    <th className="px-3 py-2 text-left">Count</th>
                    <th className="px-3 py-2 text-left">Last Used</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(map).length > 0 ? (
                    Object.entries(map).map(([token, data]) => (
                      <tr key={token} className="border-b">
                        <td className="px-3 py-2 font-mono">{token}</td>
                        <td className="px-3 py-2 capitalize">{data.field}</td>
                        <td className="px-3 py-2">{data.category || '-'}</td>
                        <td className="px-3 py-2">{data.subcategory || '-'}</td>
                        <td className="px-3 py-2 text-center">{data.count}</td>
                        <td className="px-3 py-2 text-gray-500 text-xs">{data.lastUsed?.split('T')[0]}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-3 py-[var(--page-padding-y)] text-center text-muted-foreground">
                        No token mappings yet. Use the Learning Tester to train tokens.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </Layout>
  );
};

export default MasterMind;
