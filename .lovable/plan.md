
# Plan: Add TemplateStatsSection to Settings Page (Option B - Always Visible)

## Summary

Add the `TemplateStatsSection` component to the Settings page so it's visible to all users (not behind a beta lock).

---

## Current State

| Item | Status |
|------|--------|
| Component exists | `src/components/settings/TemplateStatsSection.tsx` |
| Imported in Settings.tsx | No |
| Rendered in Settings.tsx | No |
| Dev banner enabled | Yes (line 55: `showDevBanner = true`) |

---

## Implementation Steps

### Step 1: Import TemplateStatsSection in Settings.tsx

**File:** `src/pages/Settings.tsx`  
**Location:** After line 71 (after other imports)

```typescript
import TemplateStatsSection from '@/components/settings/TemplateStatsSection';
```

### Step 2: Render TemplateStatsSection in the UI

**File:** `src/pages/Settings.tsx`  
**Location:** After line 891 (after the Beta Features section, before the Version section)

```typescript
{/* Template Stats Section */}
<TemplateStatsSection />
```

### Step 3: Disable the Dev Banner

**File:** `src/components/settings/TemplateStatsSection.tsx`  
**Location:** Line 55

Change from:
```typescript
const showDevBanner = true;
```

To:
```typescript
const showDevBanner = false;
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Settings.tsx` | 1. Add import for TemplateStatsSection 2. Render component after Beta Features section |
| `src/components/settings/TemplateStatsSection.tsx` | Set `showDevBanner = false` |

---

## Visual Placement

The Template Stats section will appear in this order on the Settings page:

1. Display settings
2. SMS Auto-Import  
3. Notifications
4. Data (Export/Import/Clear)
5. Beta Features
6. **Template Stats** (new)
7. Version footer
8. OTA Debug (native only)

---

## Testing Checklist

| Test | Expected Result |
|------|-----------------|
| Open Settings page | TemplateStatsSection visible below Beta Features |
| No red dev banner | Banner should not appear (showDevBanner = false) |
| Click time range buttons (7d/30d/90d) | Stats reload for selected range |
| Click Refresh button | Stats reload from templateService |
| Stats display | Shows Total Templates, Ready, Learning Coverage, Efficiency |
