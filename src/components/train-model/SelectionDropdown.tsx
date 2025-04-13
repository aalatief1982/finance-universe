
import React, { useState } from 'react';
import { 
  Tag, 
  Star, 
  Ban, 
  ChevronsUpDown,
  Check
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  PopoverArrow,
} from '@/components/ui/popover';
import {
  Command,
  CommandInput,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const FIELD_OPTIONS = [
  { value: 'amount', label: 'Amount' },
  { value: 'currency', label: 'Currency' },
  { value: 'vendor', label: 'Vendor' },
  { value: 'account', label: 'Account' },
  { value: 'date', label: 'Date' },
  { value: 'type', label: 'Type' },
  { value: 'category', label: 'Category' },
  { value: 'subcategory', label: 'Subcategory' },
  { value: 'title', label: 'Title' }
];

interface SelectionDropdownProps {
  top: number;
  left: number;
  selectedText: string;
  onSelect: (action: 'direct' | 'infer' | 'ignore', fieldName?: string, inferValue?: string) => void;
  onClose: () => void;
}

const SelectionDropdown: React.FC<SelectionDropdownProps> = ({
  top,
  left,
  selectedText,
  onSelect,
  onClose
}) => {
  const [actionType, setActionType] = useState<'direct' | 'infer' | 'ignore' | null>(null);
  const [selectedField, setSelectedField] = useState<string>('');
  const [inferValue, setInferValue] = useState<string>('');
  const [fieldComboOpen, setFieldComboOpen] = useState(false);

  const handleActionClick = (action: 'direct' | 'infer' | 'ignore') => {
    setActionType(action);
    if (action === 'ignore') {
      onSelect('ignore');
      onClose();
    }
  };

  const handleConfirm = () => {
    if (actionType === 'direct' && selectedField) {
      onSelect('direct', selectedField);
      onClose();
    } else if (actionType === 'infer' && selectedField && inferValue) {
      onSelect('infer', selectedField, inferValue);
      onClose();
    }
  };

  return (
    <div 
      className="absolute animate-fade-in animate-scale-in shadow-lg bg-white dark:bg-gray-800 rounded-md border border-border z-50"
      style={{ 
        top: `${top}px`, 
        left: `${Math.max(0, left - 110)}px`,
        width: '220px'
      }}
    >
      {!actionType ? (
        <div className="p-2 space-y-1">
          <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
            Selected: "{selectedText.length > 15 ? selectedText.slice(0, 15) + '...' : selectedText}"
          </div>
          
          <Button 
            variant="ghost" 
            className="w-full justify-start text-sm" 
            size="sm"
            onClick={() => handleActionClick('direct')}
          >
            <Tag className="mr-2 h-4 w-4" />
            Direct Attribute
          </Button>
          
          <Button 
            variant="ghost" 
            className="w-full justify-start text-sm" 
            size="sm"
            onClick={() => handleActionClick('infer')}
          >
            <Star className="mr-2 h-4 w-4" />
            Infer Attribute
          </Button>
          
          <Button 
            variant="ghost" 
            className="w-full justify-start text-sm" 
            size="sm"
            onClick={() => handleActionClick('ignore')}
          >
            <Ban className="mr-2 h-4 w-4" />
            Ignore
          </Button>
        </div>
      ) : (
        <div className="p-3 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <div className="text-xs font-medium">
              {actionType === 'direct' ? 'Direct Attribute' : 'Infer Attribute'}
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 w-6 p-0" 
              onClick={() => setActionType(null)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="field-select" className="text-xs">Select Field</Label>
            <Popover open={fieldComboOpen} onOpenChange={setFieldComboOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={fieldComboOpen}
                  className="w-full justify-between text-sm h-8"
                >
                  {selectedField
                    ? FIELD_OPTIONS.find((field) => field.value === selectedField)?.label
                    : "Select field..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <PopoverArrow />
                <Command>
                  <CommandInput placeholder="Search fields..." />
                  <CommandEmpty>No field found.</CommandEmpty>
                  <CommandList>
                    <CommandGroup>
                      {FIELD_OPTIONS.map((field) => (
                        <CommandItem
                          key={field.value}
                          value={field.value}
                          onSelect={(currentValue) => {
                            setSelectedField(currentValue);
                            setFieldComboOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedField === field.value
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {field.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          
          {actionType === 'infer' && (
            <div className="space-y-2">
              <Label htmlFor="infer-value" className="text-xs">Infer Value</Label>
              <Input
                id="infer-value"
                value={inferValue}
                onChange={(e) => setInferValue(e.target.value)}
                className="h-8 text-sm"
                placeholder="Value to infer..."
              />
            </div>
          )}
          
          <div className="pt-2 flex justify-end">
            <Button
              size="sm"
              onClick={handleConfirm}
              disabled={!selectedField || (actionType === 'infer' && !inferValue)}
            >
              Confirm
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SelectionDropdown;
