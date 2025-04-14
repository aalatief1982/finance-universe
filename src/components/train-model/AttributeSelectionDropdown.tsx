import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Tag, 
  Brain, 
  X, 
  Banknote, 
  Landmark, 
  Building, 
  Store, 
  Calendar, 
  FileText, 
  CreditCard,
  Copy
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

interface AttributeSelectionDropdownProps {
  onSelect: (type: 'direct' | 'infer' | 'ignore' | 'copy', field?: string, value?: string) => void;
  onClose: () => void;
  selectedText?: string;
}

const AttributeSelectionDropdown: React.FC<AttributeSelectionDropdownProps> = ({ onSelect, onClose, selectedText }) => {
  const [mode, setMode] = useState<'main' | 'direct' | 'infer'>('main');
  const [selectedField, setSelectedField] = useState<string>('');
  const [inferValue, setInferValue] = useState<string>('');
  
  const handleDirectAttributeSelect = (field: string) => {
    onSelect('direct', field);
  };
  
  const handleInferAttributeSelect = () => {
    if (selectedField && inferValue) {
      onSelect('infer', selectedField, inferValue);
    }
  };

  const handleCopy = () => {
    onSelect('copy', undefined, selectedText);
  };
  
  const directAttributes = [
    { id: 'amount', label: 'Amount', icon: Banknote },
    { id: 'currency', label: 'Currency', icon: Landmark },
    { id: 'vendor', label: 'Vendor', icon: Store },
    { id: 'account', label: 'Account', icon: Building },
    { id: 'date', label: 'Date', icon: Calendar },
    { id: 'title', label: 'Title', icon: FileText },
    { id: 'type', label: 'Type', icon: CreditCard },
  ];
  
  return (
    <Card className="w-64 shadow-lg animate-in zoom-in-95 duration-150">
      <CardContent className="p-2">
        {mode === 'main' && (
          <div className="space-y-1">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-medium">Selection Options</p>
              <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
                <X size={14} />
              </Button>
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start gap-2"
              onClick={() => setMode('direct')}
            >
              <Tag size={14} />
              <span>Direct Attribute</span>
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start gap-2"
              onClick={() => setMode('infer')}
            >
              <Brain size={14} />
              <span>Infer Attribute</span>
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start gap-2"
              onClick={() => onSelect('ignore')}
            >
              <X size={14} />
              <span>Ignore</span>
            </Button>

            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start gap-2"
              onClick={handleCopy}
            >
              <Copy size={14} />
              <span>Copy</span>
            </Button>
          </div>
        )}
        
        {mode === 'direct' && (
          <div className="space-y-1">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-medium">Select Attribute</p>
              <Button variant="ghost" size="sm" onClick={() => setMode('main')} className="h-6 w-6 p-0">
                <X size={14} />
              </Button>
            </div>
            
            {directAttributes.map(attr => (
              <Button 
                key={attr.id}
                variant="outline" 
                size="sm" 
                className="w-full justify-start gap-2"
                onClick={() => handleDirectAttributeSelect(attr.id)}
              >
                <attr.icon size={14} />
                <span>{attr.label}</span>
              </Button>
            ))}
          </div>
        )}
        
        {mode === 'infer' && (
          <div className="space-y-2">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-medium">Infer Attribute</p>
              <Button variant="ghost" size="sm" onClick={() => setMode('main')} className="h-6 w-6 p-0">
                <X size={14} />
              </Button>
            </div>
            
            <div className="space-y-2">
              <Select 
                value={selectedField} 
                onValueChange={setSelectedField}
              >
                <SelectTrigger className="w-full h-8 text-xs">
                  <SelectValue placeholder="Select field" />
                </SelectTrigger>
                <SelectContent>
                  {directAttributes.map(attr => (
                    <SelectItem key={attr.id} value={attr.id}>
                      {attr.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Input 
                placeholder="Value to infer" 
                value={inferValue} 
                onChange={(e) => setInferValue(e.target.value)}
                className="h-8 text-xs"
              />
              
              <Button 
                size="sm" 
                className="w-full"
                onClick={handleInferAttributeSelect}
                disabled={!selectedField || !inferValue}
              >
                Confirm
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AttributeSelectionDropdown;
