// MasterMind.tsx - UI Screen for Master Token Map
import React, { useEffect, useState } from 'react';
import { masterMindService, MasterTokenMap } from '@/services/MasterMindService';
import Layout from '@/components/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const MasterMind: React.FC = () => {
  const [map, setMap] = useState<MasterTokenMap>({});

  useEffect(() => {
    setMap(masterMindService.getMap());
  }, []);

  const handleClear = () => {
    if (window.confirm("Are you sure you want to clear the MasterMind data?")) {
      masterMindService.clear();
      setMap({});
    }
  };

  return (
    <Layout>
      <div className="container max-w-4xl mx-auto py-8">
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
                <thead className="bg-gray-100">
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
                  {Object.entries(map).map(([token, data]) => (
                    <tr key={token} className="border-b">
                      <td className="px-3 py-2 font-mono">{token}</td>
                      <td className="px-3 py-2 capitalize">{data.field}</td>
                      <td className="px-3 py-2">{data.category || '-'}</td>
                      <td className="px-3 py-2">{data.subcategory || '-'}</td>
                      <td className="px-3 py-2 text-center">{data.count}</td>
                      <td className="px-3 py-2 text-gray-500 text-xs">{data.lastUsed?.split('T')[0]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default MasterMind;
