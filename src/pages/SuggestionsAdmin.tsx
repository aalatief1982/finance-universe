
// 📁 Path: src/pages/SuggestionsAdmin.tsx

import React from 'react';
import { listSuggestions, clearSuggestions } from '@/components/data/suggestions';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';

const SuggestionsAdmin: React.FC = () => {
  const suggestions = listSuggestions();
  const [refreshKey, setRefreshKey] = React.useState(0);

  const handleClear = () => {
    clearSuggestions();
    setRefreshKey(prev => prev + 1);
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Suggestion Memory (Vendor → Type & Category)</h1>

        {Object.keys(suggestions).length === 0 ? (
          <p className="text-gray-500">No suggestions stored yet.</p>
        ) : (
          <div className="space-y-4">
            {Object.entries(suggestions).map(([vendor, entry]) => (
              <div
                key={vendor}
                className="p-3 border border-gray-300 rounded-md shadow-sm bg-white"
              >
                <div className="font-semibold text-blue-700">{vendor}</div>
                <div className="text-sm text-gray-700">
                  Type: <strong>{entry.type}</strong><br />
                  Category: <strong>{entry.category}</strong><br />
                  Last Updated: {new Date(entry.updatedAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}

        <Button
          className="mt-6 bg-red-600 hover:bg-red-700 text-white"
          onClick={handleClear}
        >
          Clear All Suggestions
        </Button>
      </div>
    </Layout>
  );
};

export default SuggestionsAdmin;
