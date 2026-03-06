

## Plan: Fix Build Errors and Smart Entry Navigation

### Problem
Two issues are blocking Smart Entry:

1. **Build error in MobileNavigation.tsx**: The `renderMenuItemContent` function's `IconComponent` parameter type `React.ComponentType<{ size?: number; className?: string }>` is incompatible with Lucide's `ForwardRefExoticComponent`. This causes 5 TypeScript errors that break the build.

2. **Route guard blocks `/import-transactions`**: `SMS_AUTO_IMPORT_ENABLED` is hardcoded to `false` in `src/lib/env.ts`, causing `ImportDisabledGuard` to redirect away from the Smart Entry page.

### Changes

**1. Fix type error in `src/components/header/MobileNavigation.tsx` (line 68)**

Change the `IconComponent` parameter type to `React.ComponentType<any>` to accept Lucide icon components:

```typescript
// Before
IconComponent?: React.ComponentType<{ size?: number; className?: string }>,
// After  
IconComponent?: React.ComponentType<any>,
```

**2. Enable Smart Entry route in `src/lib/env.ts` (line 68)**

```typescript
// Before
export const SMS_AUTO_IMPORT_ENABLED = false;
// After
export const SMS_AUTO_IMPORT_ENABLED = true;
```

