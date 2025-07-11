import { safeStorage } from "@/utils/safe-storage";
import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2 } from 'lucide-react';
import { TransactionType } from '@/types/transaction';

interface Rule {
  id: string;
  keywords: string;
  type: TransactionType;
  category: string;
  subcategory: string;
}

const STORAGE_KEY = 'xpensia_custom_rules';

const loadRules = (): Rule[] => {
  try {
    const raw = safeStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveRules = (rules: Rule[]) => {
  safeStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
};

const CustomParsingRules = () => {
  const [rules, setRules] = useState<Rule[]>([]);
  const [keywords, setKeywords] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');

  useEffect(() => {
    setRules(loadRules());
  }, []);

  const addRule = () => {
    if (!keywords.trim()) return;
    const newRule: Rule = {
      id: Date.now().toString(),
      keywords: keywords.trim(),
      type,
      category: category.trim(),
      subcategory: subcategory.trim(),
    };
    const updated = [...rules, newRule];
    setRules(updated);
    saveRules(updated);
    setKeywords('');
    setCategory('');
    setSubcategory('');
  };

  const deleteRule = (id: string) => {
    const updated = rules.filter(r => r.id !== id);
    setRules(updated);
    saveRules(updated);
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Add Parsing Rule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Keywords (comma separated)"
              value={keywords}
              onChange={e => setKeywords(e.target.value)}
            />
            <Select value={type} onValueChange={val => setType(val as TransactionType)}>
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                {['expense', 'income', 'transfer'].map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Category"
              value={category}
              onChange={e => setCategory(e.target.value)}
            />
            <Input
              placeholder="Subcategory"
              value={subcategory}
              onChange={e => setSubcategory(e.target.value)}
            />
            <Button type="button" onClick={addRule}>+ Add Rule</Button>
          </CardContent>
        </Card>

        {rules.map(rule => (
          <Card key={rule.id} className="flex justify-between items-start p-4">
            <div className="space-y-1 text-sm">
              <div><strong>Keywords:</strong> {rule.keywords}</div>
              <div><strong>Type:</strong> {rule.type}</div>
              <div><strong>Category:</strong> {rule.category}</div>
              {rule.subcategory && (
                <div><strong>Subcategory:</strong> {rule.subcategory}</div>
              )}
            </div>
            <Button variant="destructive" size="icon" onClick={() => deleteRule(rule.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </Card>
        ))}
      </div>
    </Layout>
  );
};

export default CustomParsingRules;
