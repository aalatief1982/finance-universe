/**
 * @file VendorAutocomplete.tsx
 * @description UI component for VendorAutocomplete.
 *
 * @module components/VendorAutocomplete
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

import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VendorAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  vendors: string[];
  onAddClick: () => void;
  isAutoFilled?: boolean;
  hasLowConfidence?: boolean;
  placeholder?: string;
  className?: string;
  userHasInteracted?: boolean;
}

const VendorAutocomplete: React.FC<VendorAutocompleteProps> = ({
  value,
  onChange,
  vendors,
  onAddClick,
  isAutoFilled = false,
  hasLowConfidence = false,
  placeholder = "e.g., Netflix",
  className,
  userHasInteracted = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredVendors, setFilteredVendors] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  useEffect(() => {
    if (searchTerm.length >= 3) {
      const filtered = vendors
        .filter(vendor => 
          vendor.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .slice(0, 4); // Limit to 4 results
      setFilteredVendors(filtered);
      setIsOpen(userHasInteracted && filtered.length > 0);
    } else {
      setFilteredVendors([]);
      setIsOpen(false);
    }
  }, [searchTerm, vendors, userHasInteracted]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    onChange(newValue);
  };

  const handleSelectVendor = (vendor: string) => {
    setSearchTerm(vendor);
    onChange(vendor);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div className="flex items-center gap-1">
        <div className="relative flex-1">
          <Input
            ref={inputRef}
            value={searchTerm}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (searchTerm.length >= 3 && filteredVendors.length > 0) {
                setIsOpen(true);
              }
            }}
            placeholder={searchTerm.length < 3 ? "Type 3+ characters to search vendors..." : placeholder}
            isAutoFilled={isAutoFilled}
            className={cn(
              className,
              hasLowConfidence && 'border-amber-500'
            )}
          />
          {searchTerm.length >= 3 && filteredVendors.length > 0 && (
            <ChevronDown 
              className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" 
            />
          )}
        </div>
        <Button type="button" variant="outline" size="icon" onClick={onAddClick}>
          <Plus className="size-4" />
        </Button>
      </div>

      {isOpen && filteredVendors.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-40 overflow-y-auto">
          {filteredVendors.map((vendor, index) => (
            <div
              key={vendor}
              className="px-3 py-2 cursor-pointer hover:bg-muted text-sm border-b border-border last:border-b-0"
              onClick={() => handleSelectVendor(vendor)}
            >
              {vendor}
            </div>
          ))}
        </div>
      )}

      {searchTerm.length >= 3 && filteredVendors.length === 0 && isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg">
          <div className="px-3 py-2 text-sm text-muted-foreground">
            No vendors found
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorAutocomplete;
