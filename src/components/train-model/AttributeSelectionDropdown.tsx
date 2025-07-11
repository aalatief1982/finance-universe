
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

/**
 * Dropdown component for selecting attribute types during text selection.
 * Provides options for direct attribute tagging, inference, ignoring, and copying text.
 * Supports different modes with appropriate input fields for each.
 */
const AttributeSelectionDropdown: React.FC<AttributeSelectionDropdownProps> = ({ onSelect, onClose, selectedText }) => {
  const [mode, setMode] = useState<'main' | 'direct' | 'infer'>('main');
  const [selectedField, setSelectedField] = useState<string>('');
  const [inferValue, setInferValue] = useState<string>('');
  
  if (import.meta.env.MODE === 'development') {
    console.log("[AttributeSelectionDropdown] Rendered with text:", selectedText?.substring(0, 20));
  }
  
  /**
   * Handles direct attribute selection for tagging text.
   * Immediately invokes the parent callback with the selected field.
   */
  const handleDirectAttributeSelect = (field: string) => {
    if (import.meta.env.MODE === 'development') {
      console.log("[AttributeSelectionDropdown] Direct attribute selected:", field);
    }
    onSelect('direct', field);
  };
  
  /**
   * Handles attribute inference with user-provided values.
   * Validates input and invokes parent callback with field and value.
   */
  const handleInferAttributeSelect = () => {
    if (selectedField && inferValue) {
      if (import.meta.env.MODE === 'development') {
        console.log("[AttributeSelectionDropdown] Infer attribute selected:", { field: selectedField, value: inferValue });
      }
      onSelect('infer', selectedField, inferValue);
    }
  };

  /**
   * Handles copy operation for selected text.
   * Invokes parent callback with the 'copy' type.
   */
  const handleCopy = () => {
    if (import.meta.env.MODE === 'development') {
      console.log("[AttributeSelectionDropdown] Copy selected for text:", selectedText?.substring(0, 20));
    }
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
              <Button variant="ghost" size="sm" onClick={() => {
                if (import.meta.env.MODE === 'development') {
                  console.log("[AttributeSelectionDropdown] Close clicked");
                }
                onClose();
              }} className="h-6 w-6 p-0">
                <X size={14} />
              </Button>
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start gap-2"
              onClick={() => {
                if (import.meta.env.MODE === 'development') {
                  console.log("[AttributeSelectionDropdown] Direct mode selected");
                }
                setMode('direct');
              }}
            >
              <Tag size={14} />
              <span>Direct Attribute</span>
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start gap-2"
              onClick={() => {
                if (import.meta.env.MODE === 'development') {
                  console.log("[AttributeSelectionDropdown] Infer mode selected");
                }
                setMode('infer');
              }}
            >
              <Brain size={14} />
              <span>Infer Attribute</span>
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start gap-2"
              onClick={() => {
                if (import.meta.env.MODE === 'development') {
                  console.log("[AttributeSelectionDropdown] Ignore selected");
                }
                onSelect('ignore');
              }}
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
              <Button variant="ghost" size="sm" onClick={() => {
                if (import.meta.env.MODE === 'development') {
                  console.log("[AttributeSelectionDropdown] Back to main");
                }
                setMode('main');
              }} className="h-6 w-6 p-0">
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
              <Button variant="ghost" size="sm" onClick={() => {
                if (import.meta.env.MODE === 'development') {
                  console.log("[AttributeSelectionDropdown] Back to main");
                }
                setMode('main');
              }} className="h-6 w-6 p-0">
                <X size={14} />
              </Button>
            </div>
            
            <div className="space-y-2">
              <Select 
                value={selectedField} 
                onValueChange={(value) => {
                  if (import.meta.env.MODE === 'development') {
                    console.log("[AttributeSelectionDropdown] Field selected for inference:", value);
                  }
                  setSelectedField(value);
                }}
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
                onChange={(e) => {
                  if (import.meta.env.MODE === 'development') {
                    console.log("[AttributeSelectionDropdown] Infer value changed:", e.target.value);
                  }
                  setInferValue(e.target.value);
                }}
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
