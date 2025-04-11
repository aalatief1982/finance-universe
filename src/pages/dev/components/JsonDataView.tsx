
import React from 'react';
import { LearnedEntry } from '@/types/learning';

interface JsonDataViewProps {
  entry: LearnedEntry;
}

const JsonDataView: React.FC<JsonDataViewProps> = ({ entry }) => {
  return (
    <div className="bg-muted p-3 rounded-md">
      <pre className="text-xs overflow-auto max-h-[300px] whitespace-pre-wrap">
        {JSON.stringify(entry, null, 2)}
      </pre>
    </div>
  );
};

export default JsonDataView;
