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

import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  inputId?: string;
}

const normalize = (value: string) => value.trim().toLowerCase();

export const formatVendorDisplay = (name: string) =>
  name
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());

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
  inputId,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  const sortedVendors = useMemo(
    () => [...vendors].sort((a, b) => formatVendorDisplay(a).localeCompare(formatVendorDisplay(b))),
    [vendors]
  );

  const shouldFilterBySearch = searchTerm.trim().length >= 3;
  const filteredVendors = useMemo(() => {
    if (!shouldFilterBySearch) {
      return sortedVendors;
    }

    return sortedVendors.filter(vendor => normalize(vendor).includes(normalize(searchTerm)));
  }, [searchTerm, shouldFilterBySearch, sortedVendors]);

  useEffect(() => {
    if (!userHasInteracted) {
      setIsOpen(false);
    }
  }, [userHasInteracted]);

  const ensureInputVisible = () => {
    inputRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'nearest',
    });
  };

  useEffect(() => {
    if (!isOpen) return;

    ensureInputVisible();

    const viewport = window.visualViewport;
    if (!viewport) return;

    const handleViewportResize = () => ensureInputVisible();
    viewport.addEventListener('resize', handleViewportResize);

    return () => viewport.removeEventListener('resize', handleViewportResize);
  }, [isOpen]);

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
            id={inputId}
            value={searchTerm}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              ensureInputVisible();
              if (userHasInteracted) {
                setIsOpen(true);
              }
            }}
            placeholder={placeholder}
            isAutoFilled={isAutoFilled}
            className={cn(
              className,
              hasLowConfidence && 'border-amber-500'
            )}
          />
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-1 text-muted-foreground hover:bg-muted"
            onClick={() => {
              ensureInputVisible();
              setIsOpen(prev => !prev);
            }}
            aria-label="Toggle payee picklist"
          >
            <ChevronDown 
              className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')}
            />
          </button>
        </div>
        <Button type="button" variant="outline" size="icon" onClick={onAddClick}>
          <Plus className="size-4" />
        </Button>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-40 overflow-y-auto">
          {filteredVendors.length > 0 ? (
            filteredVendors.map((vendor) => (
              <div
                key={vendor}
                className="px-3 py-2 cursor-pointer hover:bg-muted text-sm border-b border-border last:border-b-0"
                onClick={() => handleSelectVendor(vendor)}
                onKeyDown={(e) => e.key === 'Enter' && handleSelectVendor(vendor)}
                role="button"
                tabIndex={0}
              >
                {formatVendorDisplay(vendor)}
              </div>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-muted-foreground">No matches</div>
          )}
        </div>
      )}

      {userHasInteracted && !shouldFilterBySearch && (
        <div className="mt-1 px-1 text-xs text-muted-foreground">Type 3+ characters to search</div>
      )}
    </div>
  );
};

export default VendorAutocomplete;
