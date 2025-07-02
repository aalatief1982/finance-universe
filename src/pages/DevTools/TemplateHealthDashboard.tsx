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
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { loadTemplateBank } from '@/lib/smart-paste-engine/templateUtils';
import { loadKeywordBank } from '@/lib/smart-paste-engine/keywordBankUtils';
import { SmartPasteTemplate } from '@/types/template';

interface TemplateRow {
  key: string;
  template: SmartPasteTemplate;
  keywords: string[];
}

const TemplateHealthDashboard: React.FC = () => {
  const [rows, setRows] = useState<TemplateRow[]>([]);
  const [filter, setFilter] = useState<'all' | 'unused' | 'fallback' | 'top'>('all');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    const templates = loadTemplateBank();
    const keywordBank = loadKeywordBank();
    const list: TemplateRow[] = Object.entries(templates).map(([key, tpl]) => {
      const keywords = keywordBank
        .filter(k => tpl.rawSample?.toLowerCase().includes(k.keyword.toLowerCase()))
        .map(k => k.keyword);
      return { key, template: tpl, keywords };
    });
    setRows(list);
  }, []);

  const filtered = rows.filter(r => {
    const usage = r.template.meta?.usageCount ?? 0;
    const fallback = r.template.meta?.fallbackCount ?? 0;
    if (filter === 'unused') return usage === 0;
    if (filter === 'fallback') return usage > 0 && fallback / usage >= 0.5;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const ua = a.template.meta?.usageCount ?? 0;
    const ub = b.template.meta?.usageCount ?? 0;
    if (sortDir === 'asc') return ua - ub;
    return ub - ua;
  });

  const displayed = filter === 'top' ? sorted.slice(0, 20) : sorted;

  const toggleSort = () => {
    setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
  };

  const renderRatio = (success: number, usage: number) => {
    if (!usage) return '0%';
    return `${Math.round((success / usage) * 100)}%`;
  };

  return (
    <Layout>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Template Health</h1>
        <ToggleGroup
          type="single"
          value={filter}
          onValueChange={val => setFilter((val || 'all') as any)}
          className="bg-muted p-1 rounded-md w-full max-w-md"
        >
          <ToggleGroupItem value="all" className="flex-1">All</ToggleGroupItem>
          <ToggleGroupItem value="unused" className="flex-1">Unused</ToggleGroupItem>
          <ToggleGroupItem value="fallback" className="flex-1">High Fallback</ToggleGroupItem>
          <ToggleGroupItem value="top" className="flex-1">Most Used</ToggleGroupItem>
        </ToggleGroup>
        <div className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead onClick={toggleSort} className="cursor-pointer">
                  Hash
                </TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Success %</TableHead>
                <TableHead>Fallback %</TableHead>
                <TableHead>Keywords</TableHead>
                <TableHead>Sample</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayed.map(r => {
                const usage = r.template.meta?.usageCount ?? 0;
                const success = r.template.meta?.successCount ?? 0;
                const fallback = r.template.meta?.fallbackCount ?? 0;
                return (
                  <TableRow key={r.key}>
                    <TableCell className="font-mono text-xs">{r.template.id}</TableCell>
                    <TableCell>{usage}</TableCell>
                    <TableCell>{renderRatio(success, usage)}</TableCell>
                    <TableCell>{renderRatio(fallback, usage)}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {r.keywords.join(', ') || '-'}
                    </TableCell>
                    <TableCell className="max-w-[300px] truncate">
                      {r.template.rawSample || ''}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </Layout>
  );
};

export default TemplateHealthDashboard;

