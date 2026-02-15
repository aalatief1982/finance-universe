

# Add "+" Button to Account Selector on Set Budget Page

## What Changes

When the budget scope is "Account", the account dropdown on the Set Budget page will get a "+" button next to it -- identical to the Transaction page's "From Account" field. Clicking it opens a dialog to add a new account (Name + IBAN), which saves to the same `xpensia_accounts` localStorage key via `addUserAccount()`. The new account immediately appears in the dropdown.

## UI Change

**Current:**
```text
[ Select Account          v ]
```

**After:**
```text
[ Select Account          v ] [+]
```

Clicking [+] opens a dialog with Name (required) and IBAN (optional) fields, matching the Transaction page dialog exactly.

## Technical Details

**File to modify:** `src/pages/budget/SetBudgetPage.tsx`

### 1. Add imports
- `Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter` from `@/components/ui/dialog`
- `Plus` from `lucide-react`
- `addUserAccount, getStoredAccounts` from `@/lib/account-utils`

### 2. Add state variables (inside `SetBudgetPage` component)
- `addAccountOpen` (boolean) -- controls dialog visibility
- `newAccount` (`{ name: string; iban: string }`) -- dialog form state

### 3. Add `handleSaveAccount` function
- Validates name is not empty
- Calls `addUserAccount({ name, iban })` -- same function used by Transaction page, writes to same `xpensia_accounts` localStorage key
- Refreshes the accounts list so the new account appears in the targets list
- Auto-selects the new account as `targetId`
- Closes dialog and resets form

### 4. Modify the account Select UI (around line 648)
- Wrap the existing `<Select>` in a `<div className="flex items-center gap-1">`
- Add a `<Button variant="outline" size="icon">` with `<Plus>` icon, visible only when `scope === 'account'`

### 5. Add the Dialog JSX
- Reuse the same dialog structure from `TransactionEditForm.tsx` (Name + IBAN fields)
- Place it at the end of the component's JSX

### Key Detail: Shared Storage
Both the Transaction page and Set Budget page use `addUserAccount()` from `@/lib/account-utils`, which writes to the `xpensia_accounts` localStorage key. This ensures accounts added from either page appear in both picklists automatically.

