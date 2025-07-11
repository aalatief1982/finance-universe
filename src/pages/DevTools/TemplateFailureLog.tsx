import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface FailureEntry {
  hash: string;
  sender?: string;
  rawMessage: string;
  expectedStructure: string;
  timestamp: number;
}

interface GroupedFailure {
  hash: string;
  sender?: string;
  count: number;
  samples: string[];
}

const STORAGE_KEY = 'xpensia_template_failures';

const TemplateFailureLog: React.FC = () => {
  const [groups, setGroups] = useState<GroupedFailure[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const entries: FailureEntry[] = JSON.parse(raw);
      const map: Record<string, GroupedFailure> = {};
      for (const e of entries) {
        const key = `${e.hash}::${e.sender || ''}`;
        if (!map[key]) {
          map[key] = { hash: e.hash, sender: e.sender, count: 0, samples: [] };
        }
        map[key].count += 1;
        if (map[key].samples.length < 5) {
          map[key].samples.push(e.rawMessage);
        }
      }
      setGroups(Object.values(map));
    } catch (err) {
      if (import.meta.env.MODE === 'development') {
        console.error('Failed to load template failures', err);
      }
    }
  }, []);

  return (
    <Layout>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Template Failures</h1>
        <div className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hash</TableHead>
                <TableHead>Sender</TableHead>
                <TableHead>Count</TableHead>
                <TableHead>Samples</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.map(g => (
                <TableRow key={`${g.hash}-${g.sender}`}>
                  <TableCell className="font-mono text-xs">{g.hash}</TableCell>
                  <TableCell>{g.sender || '-'}</TableCell>
                  <TableCell>{g.count}</TableCell>
                  <TableCell className="max-w-[300px] truncate">
                    {g.samples.join(' | ')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </Layout>
  );
};

export default TemplateFailureLog;
