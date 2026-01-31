/**
 * @file PersonSelector.tsx
 * @description UI component for PersonSelector.
 *
 * @module components/forms/PersonSelector
 *
 * @responsibilities
 * 1. Render UI for the feature area
 * 2. Accept props and emit user interactions
 * 3. Compose shared subcomponents where needed
 *
 * @review-tags
 * - @ui: visual/layout behavior
 *
 * @review-checklist
 * - [ ] Props have sensible defaults
 * - [ ] Component renders without crashing
 */

import React, { useState } from 'react';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UseFormReturn } from 'react-hook-form';
import { TransactionFormValues } from './transaction-form-schema';
import { getPeopleNames, addUserPerson } from '@/lib/people-utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface PersonSelectorProps {
  form: UseFormReturn<TransactionFormValues>;
}

const PersonSelector: React.FC<PersonSelectorProps> = ({
  form
}) => {
  const [people, setPeople] = useState<string[]>(() => getPeopleNames());
  const [addOpen, setAddOpen] = useState(false);
  const [newPerson, setNewPerson] = useState({ name: '', relation: '' });

  const handleSave = () => {
    if (!newPerson.name.trim()) return;
    addUserPerson({ name: newPerson.name.trim(), relation: newPerson.relation.trim() || undefined });
    setPeople(getPeopleNames());
    form.setValue('person', newPerson.name.trim());
    setNewPerson({ name: '', relation: '' });
    setAddOpen(false);
  };

  return (
    <>
      <FormField
        control={form.control}
        name="person"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Main Person</FormLabel>
            <div className="flex items-center gap-1">
              <Select
                value={field.value || 'none'}
                onValueChange={field.onChange}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select person (optional)" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {people.map(person => (
                    <SelectItem key={person} value={person}>
                      {person}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" variant="outline" size="icon" onClick={() => setAddOpen(true)}>
                <Plus className="size-4" />
              </Button>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Person</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Name*</label>
              <Input value={newPerson.name} onChange={e => setNewPerson(prev => ({ ...prev, name: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Relation</label>
              <Input value={newPerson.relation} onChange={e => setNewPerson(prev => ({ ...prev, relation: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button type="button" onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PersonSelector;
