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
import { formatVendorDisplay } from './VendorAutocomplete.utils';

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
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [wasExplicitlyClosed, setWasExplicitlyClosed] = useState(false);
  const [openAbove, setOpenAbove] = useState(false);
  const [dropdownMaxHeight, setDropdownMaxHeight] = useState(240);
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
    requestAnimationFrame(() => {
      inputRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest',
      });
    });
  };

  const updateDropdownLayout = () => {
    const inputEl = inputRef.current;
    if (!inputEl) return;

    const rect = inputEl.getBoundingClientRect();
    const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
    const spaceAbove = Math.max(0, rect.top - 8);
    const spaceBelow = Math.max(0, viewportHeight - rect.bottom - 8);
    const shouldOpenAbove = spaceBelow < 180 && spaceAbove > spaceBelow;
    const availableSpace = shouldOpenAbove ? spaceAbove : spaceBelow;

    setOpenAbove(shouldOpenAbove);
    setDropdownMaxHeight(Math.max(120, Math.min(320, Math.floor(availableSpace))));
  };

  useEffect(() => {
    if (!isOpen && !isInputFocused) return;

    ensureInputVisible();
    updateDropdownLayout();

    const viewport = window.visualViewport;
    const handleViewportChange = () => {
      ensureInputVisible();
      updateDropdownLayout();
    };

    viewport?.addEventListener('resize', handleViewportChange);
    viewport?.addEventListener('scroll', handleViewportChange);
    window.addEventListener('resize', handleViewportChange);

    return () => {
      viewport?.removeEventListener('resize', handleViewportChange);
      viewport?.removeEventListener('scroll', handleViewportChange);
      window.removeEventListener('resize', handleViewportChange);
    };
  }, [isOpen, isInputFocused]);

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
    if (!wasExplicitlyClosed) {
      setIsOpen(true);
    }
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
      setWasExplicitlyClosed(true);
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
              setIsInputFocused(true);
              ensureInputVisible();
              if (!wasExplicitlyClosed) {
                setIsOpen(true);
              }
            }}
            onBlur={() => {
              setIsInputFocused(false);
              setWasExplicitlyClosed(false);
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
              const nextOpen = !isOpen;
              setIsOpen(nextOpen);
              setWasExplicitlyClosed(!nextOpen);
              if (nextOpen) {
                updateDropdownLayout();
                inputRef.current?.focus();
              }
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
        <div
          className={cn(
            'absolute z-50 w-full bg-background border border-border rounded-md shadow-lg overflow-y-auto',
            openAbove ? 'bottom-full mb-1' : 'mt-1'
          )}
          style={{ maxHeight: `${dropdownMaxHeight}px` }}
        >
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
