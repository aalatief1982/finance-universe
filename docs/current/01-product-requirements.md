# Xpensia — Product Requirements Document

> **Status**: Living document — reflects current implemented state  
> **Last synced with codebase**: 2026-03-11

---

## 1. Problem Statement

Managing personal finances across multiple bank accounts, currencies, and SMS-based transaction notifications is fragmented. Users in the MENA region receive financial SMS from banks in Arabic and English, but no tool automatically parses these into structured expense records with categorization, budgeting, and analytics.

## 2. Target Users

| Persona | Description |
|---|---|
| Primary | Arabic/English bilingual users in Saudi Arabia and GCC who receive bank SMS notifications |
| Secondary | Anyone who wants to manually track expenses with smart text parsing |
| Power users | Users who want voice-based entry, budget tracking, and multi-currency analytics |

## 3. Solution Overview

Xpensia is a mobile-first (Capacitor/Android + web) personal finance tracker that:

1. **Auto-detects financial SMS** in the background via a native Android listener
2. **Parses transactions** from text using a template matching + NER inference engine
3. **Supports manual entry** via paste, type, or voice with the same parsing engine
4. **Learns from user confirmations** to improve future parsing accuracy
5. **Provides analytics** with FX-aware multi-currency aggregation
6. **Manages budgets** with alerts, reports, and insights

## 4. Feature Scope — Currently Implemented

### Core Features (Active)

| Feature | Route | Status |
|---|---|---|
| Onboarding (3-slide carousel) | `/onboarding` | ✅ Active |
| Default currency selection | `/set-default-currency` | ✅ Active |
| Home dashboard with stats & charts | `/home` | ✅ Active |
| Smart Entry (paste/type/voice) | `/import-transactions` | ✅ Active |
| SMS Review Inbox | `/sms-review` | ✅ Active |
| Transaction edit with inference labels | `/edit-transaction` | ✅ Active |
| Transaction list with filters/search | `/transactions` | ✅ Active |
| Analytics (category, timeline, net balance) | `/analytics` | ✅ Active |
| Budget hub, detail, set, report, insights | `/budget/*` | ✅ Active |
| Exchange rates viewer/editor | `/exchange-rates` | ✅ Active |
| Settings (theme, currency, export/import, SMS) | `/settings` | ✅ Active |
| Profile (user info, avatar) | `/profile` | ✅ Active |
| About page | `/about` | ✅ Active |

### Native-Only Features (Active on Android)

| Feature | Description |
|---|---|
| Background SMS listener | Native BroadcastReceiver with financial keyword filtering |
| SMS notification tap → review | Local notification routes to SMS Review Inbox |
| SMS permission management | Runtime permission flow for READ_SMS |
| Share sheet intake | Receives shared text from other apps |
| OTA updates | Capgo live update with pending bundle apply |
| Camera (profile photo) | Capacitor Camera plugin |

### Dormant / Disabled Features

| Feature | Route | Status |
|---|---|---|
| Bulk SMS auto-import | `/process-sms` | Behind `ImportDisabledGuard` |
| Vendor mapping | `/vendor-mapping` | Behind `ImportDisabledGuard` |
| Bulk SMS review | `/review-sms-transactions` | Behind `ImportDisabledGuard` |
| SMS provider selection | `/sms-providers` | Behind `ImportDisabledGuard` |

### Developer Tools

| Feature | Route |
|---|---|
| Engine output inspector | `/engine-out` |
| Template trainer | `/train-model` |
| Template builder | `/build-template` |
| Custom parsing rules | `/custom-parsing-rules` |
| Keyword bank manager | `/keyword-bank` (in settings) |

## 5. Feature Scope — Out of Scope

- Cloud sync / multi-device sync
- Bill payment or banking integrations
- Investment tracking
- Receipt scanning / OCR from images
- iOS SMS reading (iOS does not permit SMS access)

## 6. Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| UI | Tailwind CSS + shadcn/ui (Radix) |
| Animation | Framer Motion |
| Mobile | Capacitor 6 (Android) |
| Charts | Recharts |
| State | React Context + localStorage/Preferences |
| Auth (optional) | Supabase (optional, app is local-first) |
| Analytics | Firebase Analytics via Capacitor plugin |
| OTA | Capgo Capacitor Updater |
| i18n | Custom LanguageContext (AR/EN) |

## 7. Data Architecture

- **Local-first**: All transaction data stored in localStorage (web) or Capacitor Preferences (native)
- **No mandatory backend**: App functions fully offline
- **Optional Supabase**: Auth layer for future cloud features
- **SMS queue**: `smsQueueService` + `smsInboxQueue` for pending SMS items
- **Learning store**: `LearnedEntry[]` persisted locally for parsing improvement

## 8. Currency Support

Primary: SAR (Saudi Riyal)  
Supported: USD, EUR, GBP, AED, KWD, BHD, OMR, QAR, EGP, JOD, and configurable via settings.  
FX aggregation with unconverted transaction warnings on dashboard.
