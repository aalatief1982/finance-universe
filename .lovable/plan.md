## Plan: Documentation Rebuild

### Status: ✅ Implemented

### Summary
Rebuilt all highlighted documentation into 8 canonical files under `docs/current/`, archived 15+ deprecated files to `docs/archive/`, fixed plugin build error, and cleaned up empty/placeholder files.

### New Documentation Structure

```
docs/current/
├── 01-product-requirements.md    — PRD reflecting current features
├── 02-ux-screens-and-flows.md    — IA map, navigation, Mermaid workflows
├── 03-technical-architecture.md  — Tech stack, parsing pipeline, SMS ingestion, learning, storage
├── 04-test-strategy.md           — Test levels, critical areas, regression strategy
├── 05-test-scripts.md            — 15 manual QA test scripts for all active screens
├── 06-screen-inventory.md        — Route map with per-screen details
├── 07-user-guide.md              — End-user guide with screenshot/video placeholders
└── 08-gap-tracker.md             — Undocumented systems, dormant features, tech debt
```

### Archived Files
All highlighted files from `docs/` (demand-pack, phase 2-6, Test_Script_Document) and `KnowledgeBase/` (PRD.docx, wireframes, roadmaps, design doc) moved to `docs/archive/`.

### Deleted Files
- `KnowledgeBase/updated prd` (empty placeholder)
- `KnowledgeBase/test.txt` (test file)

### Build Fix
Created dist/ stub files for both `capacitor-background-sms-listener` and `capacitor-sms-reader` plugins so `bun install` resolves without running build-plugins.sh first.

### Gaps Covered in 08-gap-tracker.md
- Inference DTO pipeline (undocumented)
- SMS queue two-layer architecture (undocumented)
- Learning system internals (undocumented)
- Confidence/field scoring thresholds (undocumented)
- Template vs freeform parsing distinction (undocumented)
- Dormant features behind ImportDisabledGuard
- Legacy/dead code (wireframes, mock implementations)
- Platform parity gaps (web vs Android)

### Visual Assets Needed (Not Yet Created)
- App screenshots for each screen (marked in 07-user-guide.md)
- Video recordings for: onboarding, smart entry paste, voice entry, SMS detection flow, SMS review, budget flow, share sheet
- Mermaid diagrams render from markdown in 02-ux-screens-and-flows.md
