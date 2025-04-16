
// 📁 Path: src/pages/TypeKeywordAdmin.tsx

import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { getTypeKeywordMap, initTypeKeywordDefaults } from '@/utils/init-type-keywords';
import { Button } from '@/components/ui/button';

const TypeKeywordAdmin: React.FC = () => {
  const [keywords, setKeywords] = useState<Record<string, string[]>>({});

  useEffect(() => {
    initTypeKeywordDefaults();
    setKeywords(getTypeKeywordMap());
  }, []);

  const handleAddKeyword = (type: string, newKeyword: string) => {
    if (!newKeyword) return;
    const updated = {
      ...keywords,
      [type]: [...new Set([...(keywords[type] || []), newKeyword.toLowerCase()])]
    };
    localStorage.setItem('xpensia_type_keywords', JSON.stringify(updated));
    setKeywords(updated);
  };

  const handleRemoveKeyword = (type: string, keyword: string) => {
    const updated = {
      ...keywords,
      [type]: (keywords[type] || []).filter(k => k !== keyword)
    };
    localStorage.setItem('xpensia_type_keywords', JSON.stringify(updated));
    setKeywords(updated);
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Manage Type Inference Keywords</h1>
        {['expense', 'income', 'transfer'].map(type => (
          <div key={type} className="mb-6">
            <h2 className="text-lg font-semibold capitalize mb-2">{type}</h2>
            <div className="flex flex-wrap gap-2 mb-2">
              {(keywords[type] || []).map(keyword => (
                <span
                  key={keyword}
                  className="px-2 py-1 bg-gray-200 rounded text-sm flex items-center"
                >
                  {keyword}
                  <button
                    className="ml-2 text-red-600 hover:text-red-800"
                    onClick={() => handleRemoveKeyword(type, keyword)}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const input = form.elements.namedItem('newKeyword') as HTMLInputElement;
                const value = input.value.trim();
                if (value) handleAddKeyword(type, value);
                input.value = '';
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                name="newKeyword"
                className="border p-2 rounded w-64"
                placeholder={`Add new keyword for ${type}`}
              />
              <Button type="submit">Add</Button>
            </form>
          </div>
        ))}
      </div>
    </Layout>
  );
};

export default TypeKeywordAdmin;
