

## i18n System with Arabic Language Support

### Architecture

Implement a lightweight, React Context-based i18n system (no external library needed for 2 languages). A `LanguageContext` provides a `t()` function that looks up keys from JSON translation files. Language is persisted in `safeStorage` and selectable on the first onboarding slide.

### Structure

```text
src/
├── i18n/
│   ├── LanguageContext.tsx    # Context + Provider + useLanguage hook + t() function
│   ├── en.ts                 # English translations (flat key-value map)
│   └── ar.ts                 # Arabic translations (flat key-value map)
```

**Translation key convention**: dot-separated namespace — e.g. `home.income`, `nav.transactions`, `toast.transactionCreated`, `onboarding.slide1Title`, `budget.remaining`, `settings.theme`.

### Key Design Decisions

1. **Flat key map** (`Record<string, string>`) — simple, fast lookup, easy to maintain
2. **RTL handling**: When Arabic is selected, set `document.documentElement.dir = 'rtl'` and `lang = 'ar'`. Tailwind's `rtl:` variants handle layout flips automatically.
3. **Language selector**: A compact dropdown on the first onboarding slide (top-center), defaulting to English. Also accessible from Settings page.
4. **Storage key**: `xpensia_language` in safeStorage (`'en'` or `'ar'`)
5. **Fallback**: If a key is missing in Arabic, fall back to English string

### Translation Coverage

All user-visible strings across:

| Area | Examples |
|------|----------|
| **Onboarding** (3 slides) | titles, subtitles, descriptions, CTA button |
| **Navigation** | bottom nav labels, header nav items, route titles |
| **Home/Dashboard** | stat labels (Income, Expenses, Balance), chart titles, date range labels |
| **Transactions** | list headers, empty states, filter labels, edit form fields |
| **Analytics** | chart titles, tab labels, summary text |
| **Budget** | hub summary, progress labels, set budget form, accounts page |
| **Settings** | all section titles, toggle labels, dialog text |
| **Toasts** | ~30 toast title/description pairs |
| **Dialogs/Modals** | feedback modal, confirm dialogs, alert dialogs |
| **About page** | all static content |
| **Misc** | empty states, error messages, button labels |

Estimated: ~300-400 translation keys.

### Files to Create

| File | Purpose |
|------|---------|
| `src/i18n/LanguageContext.tsx` | Provider wrapping app, `useLanguage()` hook returning `{ t, language, setLanguage, isRtl }` |
| `src/i18n/en.ts` | `export const en: Record<string, string> = { ... }` |
| `src/i18n/ar.ts` | `export const ar: Record<string, string> = { ... }` — Arabic translations file (this is the file path you asked for) |

### Files to Modify

| File | Change |
|------|--------|
| `src/App.tsx` | Wrap app with `<LanguageProvider>` |
| `src/onboarding/OnboardingSlides.tsx` | Add language dropdown at top of first slide; translate all slide text via `t()` |
| `src/components/BottomNav.tsx` | Replace hardcoded nav labels with `t()` |
| `src/components/header/route-constants.ts` | Make `routeTitleMap` and `getNavItems` use `t()` (convert to functions or pass `t`) |
| `src/components/header/MobileNavigation.tsx` | Translate menu item labels |
| `src/pages/Home.tsx` | Translate dashboard labels |
| `src/components/DashboardStats.tsx` | Translate stat labels |
| `src/pages/Transactions.tsx` | Translate headers, filters, empty states |
| `src/pages/Analytics.tsx` | Translate chart/tab labels |
| `src/pages/budget/*.tsx` | Translate budget module strings |
| `src/pages/Settings.tsx` | Translate all settings labels and dialogs |
| `src/pages/About.tsx` | Translate all static content |
| `src/components/FeedbackModal.tsx` | Translate form labels and buttons |
| `src/pages/ImportTransactions.tsx` | Translate smart entry labels |
| `src/pages/ExchangeRates.tsx` | Translate page content |
| `src/utils/error-utils.ts` | Translate error toast titles |
| Various toast call sites | Replace hardcoded toast strings with `t()` keys |

### Onboarding Language Selector

On slide 0 only, render a compact dropdown at the top center:

```text
┌─────────────────────┐
│    [ English ▾ ]    │  ← compact Select, top-center
│                     │
│   ⚡ Track Expenses │
│      Instantly      │
│   ...               │
└─────────────────────┘
```

When switched to Arabic, the entire onboarding (and app) flips to RTL with Arabic text.

### Implementation Order

1. Create `en.ts` and `ar.ts` with all translation keys
2. Create `LanguageContext.tsx` with provider, hook, RTL management
3. Wrap app in `<LanguageProvider>` in `App.tsx`
4. Add language selector to `OnboardingSlides.tsx`
5. Migrate all page/component strings to `t()` calls (batch by module)
6. Add language switcher to Settings page

### Arabic Translation File Path

**`src/i18n/ar.ts`**

