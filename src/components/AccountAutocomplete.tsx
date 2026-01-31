/**
 * @file AccountAutocomplete.tsx
 * @description UI component for AccountAutocomplete.
 *
 * @module components/AccountAutocomplete
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
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Account } from '@/lib/account-utils';

interface AccountAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  accounts: Account[];
  onAddClick: () => void;
  isAutoFilled?: boolean;
  hasLowConfidence?: boolean;
  placeholder?: string;
  className?: string;
  required?: boolean;
  userHasInteracted?: boolean;
}

const AccountAutocomplete: React.FC<AccountAutocompleteProps> = ({
  value,
  onChange,
  accounts,
  onAddClick,
  isAutoFilled = false,
  hasLowConfidence = false,
  placeholder = "Start typing account name...",
  className = "",
  required = false,
  userHasInteracted = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredAccounts, setFilteredAccounts] = useState<Account[]>([]);
  const [searchTerm, setSearchTerm] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);

  // Update search term when value prop changes
  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  // Filter accounts based on search term
  useEffect(() => {
    if (searchTerm.length >= 3) {
      const filtered = accounts.filter(account =>
        account.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredAccounts(filtered.slice(0, 3)); // Show only 3 accounts for mobile
      setIsOpen(userHasInteracted && filtered.length > 0);
    } else {
      setFilteredAccounts([]);
      setIsOpen(false);
    }
  }, [searchTerm, accounts, userHasInteracted]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
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

  const handleSelectAccount = (account: Account) => {
    setSearchTerm(account.name);
    onChange(account.name);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative flex-1">
      <div className="flex w-full items-center gap-1">
        <Input
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          isAutoFilled={isAutoFilled}
          placeholder={placeholder}
          required={required}
          title={hasLowConfidence ? 'Low confidence' : undefined}
          className={cn(
            'w-full text-sm py-2 px-3 rounded-md border-gray-300 dark:border-gray-600 focus:ring-primary',
            'bg-background text-foreground border-border placeholder:text-muted-foreground',
            hasLowConfidence && 'border-amber-500',
            className
          )}
        />
        <Button type="button" variant="outline" size="icon" onClick={onAddClick}>
          <Plus className="size-4" />
        </Button>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border border-border rounded-md shadow-lg max-h-[200px] overflow-y-auto">
          {filteredAccounts.length > 0 ? (
            <div className="py-1">
              {filteredAccounts.map((account) => (
                <div
                  key={account.name}
                  className="px-3 py-2 cursor-pointer hover:bg-accent hover:text-accent-foreground text-sm"
                  onClick={() => handleSelectAccount(account)}
                >
                  <div className="font-medium">{account.name}</div>
                  {account.iban && (
                    <div className="text-xs text-muted-foreground">{account.iban}</div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              No accounts found
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AccountAutocomplete;