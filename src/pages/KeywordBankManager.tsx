import React, { useEffect, useState } from 'react';
import {
  KeywordMapping,
  loadKeywordBank,
  saveKeywordBank,
  deleteKeyword,
} from '@/lib/smart-paste-engine/keywordBankUtils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trash2 } from 'lucide-react';

const KeywordBankManager = () => {
  const [keyword, setKeyword] = useState('');
  const [field, setField] = useState<
    'type' | 'category' | 'subcategory' | 'fromAccount' | 'vendor'
  >('type');
  const [value, setValue] = useState('');
  const [mappings, setMappings] = useState<KeywordMapping[]>([]);
  const [draftMap, setDraftMap] = useState<KeywordMapping['mappings']>([]);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    setMappings(loadKeywordBank());
  }, []);

  const handleAddMapping = () => {
    if (!field || !value.trim()) return;
    setDraftMap([...draftMap, { field, value: value.trim() }]);
    setValue('');
  };

  const handleSaveKeyword = () => {
    if (!keyword.trim() || draftMap.length === 0) return;

    const newBank = [
      ...mappings.filter(
        (m) => m.keyword !== keyword.trim().toLowerCase()
      ),
      {
        keyword: keyword.trim().toLowerCase(),
        mappings: draftMap,
      },
    ];

    saveKeywordBank(newBank);
    setMappings(newBank);
    setKeyword('');
    setDraftMap([]);
    setIsEditMode(false);
  };

  const handleEdit = (entry: KeywordMapping) => {
    setKeyword(entry.keyword);
    setDraftMap(entry.mappings);
    setIsEditMode(true);
  };

  const handleDelete = (kw: string) => {
    deleteKeyword(kw);
    setMappings(loadKeywordBank());
  };

  return (
    <div className="max-w-2xl mx-auto mt-6 space-y-6 px-[var(--page-padding-x)]">
      <Card>
        <CardHeader>
          <CardTitle>Keyword Bank Manager</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label>Keyword</Label>
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="e.g., netflix"
              disabled={isEditMode}
            />
            {isEditMode && (
              <p className="text-xs text-muted-foreground mt-1 italic">
                Editing existing keyword
              </p>
            )}
          </div>

          <div className="grid sm:grid-cols-3 gap-2 items-end">
            <div>
              <Label>Field</Label>
              <Select value={field} onValueChange={(val) => setField(val as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Field" />
                </SelectTrigger>
                <SelectContent>
                  {['type', 'category', 'subcategory', 'fromAccount', 'vendor'].map(
                    (f) => (
                      <SelectItem key={f} value={f}>
                        {f}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Value</Label>
              <Input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="e.g., Entertainment"
              />
            </div>

            <Button type="button" onClick={handleAddMapping}>
              + Add Mapping
            </Button>
          </div>

          {draftMap.length > 0 && (
            <div className="bg-muted p-3 rounded text-sm">
              <p className="font-semibold mb-2">Draft Mappings:</p>
              <ul className="list-disc pl-5">
                {draftMap.map((m, i) => (
                  <li key={i}>
                    <strong>{m.field}:</strong> {m.value}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Button type="button" onClick={handleSaveKeyword}>
            {isEditMode ? '💾 Update Keyword' : '+ Add Keyword'}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {mappings.map((entry, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle className="capitalize">{entry.keyword}</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleEdit(entry)}
                >
                  ✏️
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => handleDelete(entry.keyword)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pl-6 pb-4">
              <ul className="list-disc text-sm space-y-1">
                {entry.mappings.map((m, idx) => (
                  <li key={idx}>
                    <strong>{m.field}:</strong> {m.value}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default KeywordBankManager;
