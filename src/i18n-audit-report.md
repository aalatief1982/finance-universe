# i18n Audit Report (Targeted Arabic/RTL pass)

This report lists likely user-facing English labels that still bypass the translation library in priority screens mentioned in QA.

## Summary

- Target files scanned: **9**
- Potential untranslated string occurrences: **279**

## Findings by file

### src/pages/budget/SetBudgetPage.tsx — 79
- L623: `container px-4 py-3 pb-24 space-y-4 max-w-lg mx-auto`
- L624: `text-xl font-bold`
- L630: `text-xs font-medium text-muted-foreground`
- L631: `flex flex-wrap gap-2`
- L636: `flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors`
- L643: `h-3.5 w-3.5`
- L653: `text-sm font-medium text-muted-foreground`
- L656: `flex items-center gap-1`

### src/pages/Settings.tsx — 56
- L345: `No data to export`
- L346: `There are no transactions available to export.`
- L401: `.json,.csv`
- L417: `No valid transactions`
- L438: `Import successful`
- L439: `Transactions were imported successfully.`
- L444: `Import failed`
- L446: `Make sure the selected file is a valid JSON or CSV file.`

### src/pages/Home.tsx — 41
- L143: `EEE, MMM dd`
- L182: `container px-1 pb-[calc(var(--bottom-nav-height,0px)+var(--safe-area-bottom)+0.5rem)]`
- L183: `px-[var(--page-padding-x)] pt-[clamp(0.375rem,1.2vh,0.875rem)] pb-1`
- L184: `flex items-center gap-3 min-w-0`
- L185: `h-9 w-9 shrink-0`
- L189: `text-lg font-semibold tracking-tight truncate`
- L198: `w-full bg-muted p-1 text-muted-foreground rounded-md`
- L204: `flex-1 transition-colors data-[state=on]:bg-primary data-[state=on]:text-primary-foreground dark:data-[state=on]:text-white font-medium`

### src/pages/Analytics.tsx — 29
- L78: `grid grid-cols-1 gap-2`
- L83: `mt-2 flex items-center justify-between`
- L85: `text-lg font-semibold`
- L86: `text-xs text-muted-foreground`
- L98: `mt-2 flex items-center justify-between`
- L100: `text-lg font-semibold`
- L101: `text-xs text-muted-foreground`
- L115: `mt-2 text-lg font-semibold`

### src/pages/ReviewSmsTransactions.tsx — 27
- L16: `always apply`
- L24: `Always apply`
- L460: `Parsing messages...`
- L462: `flex justify-end mb-4 gap-2`
- L466: `Save All`
- L495: `flex justify-between mb-2 items-center`
- L496: `text-sm text-gray-500 break-words`
- L497: `flex items-center gap-1`

### src/pages/ExchangeRates.tsx — 17
- L108: `container px-1`
- L109: `px-[var(--page-padding-x)] pt-2 pb-24 space-y-4`
- L113: `py-12 text-center`
- L114: `h-12 w-12 mx-auto text-muted-foreground mb-4`
- L116: `text-muted-foreground mb-4`
- L120: `h-4 w-4 mr-1`
- L131: `text-base flex items-center gap-2`
- L133: `h-4 w-4 text-muted-foreground`

### src/pages/Profile.tsx — 13
- L115: `mx-auto max-w-md space-y-6 px-1 pt-2 pb-[calc(var(--bottom-nav-height,72px)+env(safe-area-inset-bottom,0px)+16px)]`
- L117: `flex flex-col items-center space-y-4 p-6 text-center`
- L119: `h-24 w-24`
- L131: `absolute bottom-0 right-0 bg-primary text-primary-foreground h-8 w-8 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors`
- L145: `space-y-3 p-5`
- L148: `text-sm text-muted-foreground`
- L155: `w-full sm:w-auto`
- L156: `mr-1 h-4 w-4`

### src/components/FeedbackModal.tsx — 9
- L184: `w-[calc(100%-2rem)] max-w-md max-h-[85dvh] overflow-y-auto`
- L186: `Send Feedback`
- L190: `text-sm font-medium`
- L200: `text-sm font-medium`
- L210: `text-sm font-medium`
- L221: `text-sm font-medium`
- L233: `text-sm font-medium`
- L236: `flex space-x-1`

### src/pages/SmsReviewInboxPage.tsx — 8
- L98: `SMS Review Inbox`
- L102: `rounded-md border px-3 py-2 text-sm text-muted-foreground`
- L109: `flex flex-col gap-3 rounded-md border p-3 md:flex-row md:items-center md:justify-between`
- L111: `min-w-0 space-y-1`
- L113: `text-sm text-muted-foreground`
- L114: `text-sm text-muted-foreground`
- L116: `flex items-center gap-2`
- L120: `handleIgnoreSms(item.id)}>Ignore`
