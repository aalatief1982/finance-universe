

# Unify Currency Dropdown Across the App

## Summary
Replace all currency dropdowns with an enhanced `CurrencyCombobox` that is searchable and shows country names (flag + code + country name). This will be used consistently in every place a currency is selected.

## Current State
There are 5 different currency dropdown implementations:
- **ExchangeRateDialog** -- plain `Select`, shows flag+code only, not searchable
- **DefaultCurrencyModal** -- plain `Select`, shows flag+code only, not searchable
- **TransactionEditForm** -- uses `CurrencyCombobox` (searchable), but `displayMode="codeOnly"`
- **SmsTransactionConfirmation** -- plain `Select`, shows raw code only (no flag, no country)
- **CurrencySelector form field** -- uses `CurrencyCombobox` with `displayMode="codeOnly"`

## Changes

### 1. Enhance CurrencyCombobox to show country by default
Update `src/components/currency/CurrencyCombobox.tsx`:
- Change default `displayMode` from `"codeOnly"` to `"codePlusCountry"` so dropdown items always show flag, code, and country name
- Also include country name in search filtering (already searches code+name, will also add country)
- The trigger button will still show compact flag+code for space efficiency

### 2. Replace Select in ExchangeRateDialog
Update `src/components/fx/ExchangeRateDialog.tsx`:
- Replace the `Select` component with `CurrencyCombobox`
- Keep the "Add Currency" (+) button alongside it
- Remove `Select`-related imports, add `CurrencyCombobox` import

### 3. Replace Select in DefaultCurrencyModal
Update `src/components/DefaultCurrencyModal.tsx`:
- Replace `Select` with `CurrencyCombobox`
- Remove `Select`-related imports

### 4. Replace Select in SmsTransactionConfirmation
Update `src/components/SmsTransactionConfirmation.tsx`:
- Replace the plain `Select` (which only shows currency codes) with `CurrencyCombobox`
- Remove unused `CURRENCIES` import from `categories-data`

### 5. Update CurrencySelector form field
Update `src/components/forms/CurrencySelector.tsx`:
- Change `displayMode` to `"codePlusCountry"` (or remove since it will now be the default)

### 6. Update TransactionEditForm usage
Update `src/components/TransactionEditForm.tsx`:
- Remove explicit `displayMode="codeOnly"` so it picks up the new default showing country names

## Technical Notes
- `CurrencyCombobox` already has built-in search, scrollable list, and refreshes options on open -- it is the most capable component
- The trigger button remains compact (flag + code) while the dropdown items show the full label (flag + code + country name)
- All existing props (`className`, `id`, conditional styling for driven fields, errors, etc.) are preserved
- Also fixes the pre-existing build errors from the previous round

