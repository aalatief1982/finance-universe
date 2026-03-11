# Xpensia — User Guide

> Your personal finance tracker that learns from your spending  
> **App version**: Current  
> **Platforms**: Android (full features), Web (core features)

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Home Dashboard](#home-dashboard)
3. [Adding Transactions — Smart Entry](#adding-transactions--smart-entry)
4. [Voice Entry](#voice-entry)
5. [SMS Auto-Detection](#sms-auto-detection)
6. [SMS Review Inbox](#sms-review-inbox)
7. [Editing a Transaction](#editing-a-transaction)
8. [Viewing Your Transactions](#viewing-your-transactions)
9. [Analytics & Reports](#analytics--reports)
10. [Budgets](#budgets)
11. [Exchange Rates](#exchange-rates)
12. [Settings](#settings)
13. [Profile](#profile)
14. [Sharing Text from Other Apps](#sharing-text-from-other-apps)
15. [Tips & Tricks](#tips--tricks)

---

## Getting Started

When you first open Xpensia, you'll see a short introduction:

1. **Welcome slides** — Swipe through 3 slides to learn what Xpensia does
2. **Tap "Get Started"** — Complete the introduction
3. **Choose your currency** — Pick your default currency (e.g., SAR, USD, EUR)
4. **You're ready!** — The Home Dashboard appears

> 📸 **Screenshot**: Onboarding slide 1, slide 2, slide 3, currency selection screen

> 🎥 **Video recommended**: Record the full first-launch experience from app open to Home Dashboard (≈30 seconds)

---

## Home Dashboard

Your Home screen shows a snapshot of your finances:

- **Balance card** — Total balance, income, and expenses
- **Charts** — Category breakdown, spending timeline, and net balance trend
- **Recent transactions** — Your last 5 transactions at a glance
- **Quick add button** (➕) — Floating button to jump to Smart Entry

Switch between chart views using the tabs at the top of the chart section.

> 📸 **Screenshot**: Dashboard with stats cards, category chart tab, timeline chart tab

---

## Adding Transactions — Smart Entry

Smart Entry is the fastest way to add transactions. You can paste, type, or speak.

### Paste from Bank SMS

1. Copy a bank SMS from your messages app
2. Open Xpensia → **Smart Entry** (bottom nav or ➕ button)
3. Paste the text into the input box
4. Tap **Submit**
5. Xpensia parses the amount, date, merchant, and category automatically
6. Review the parsed fields and save

### Type Manually

1. Go to **Smart Entry**
2. Type a description like: "Paid 150 SAR for groceries at Tamimi"
3. Submit — Xpensia will extract what it can
4. Fill in any missing fields and save

> 📸 **Screenshot**: Smart Entry with pasted text, Smart Entry empty state

> 🎥 **Video recommended**: Record pasting a bank SMS → auto-parse → review → save (≈45 seconds). This is the core feature and should be the hero demo video.

---

## Voice Entry

1. Tap the **microphone icon** 🎤 on the Smart Entry screen
2. Speak your transaction naturally: *"I spent fifty riyals on coffee at Starbucks today"*
3. The voice is transcribed to text automatically
4. Xpensia parses the transcript the same way as typed text
5. Review and save

> 🎥 **Video recommended**: Record voice input → transcript appears → parse → edit → save (≈30 seconds)

---

## SMS Auto-Detection

*Android only*

Xpensia can automatically detect financial SMS from your bank in the background.

### How it works

1. Enable **Background SMS** in Settings
2. Grant SMS permissions when prompted
3. When a bank SMS arrives, Xpensia checks if it's a financial transaction
4. If it is, a **notification** appears on your phone
5. Tap the notification to review the transaction

### What SMS are detected?

Xpensia uses a triple-gate filter:
- ✅ Contains financial keywords (purchase, transfer, payment, etc.)
- ✅ Contains an amount (numbers with currency)
- ✅ Contains a date

OTP/verification codes are automatically excluded.

> 📸 **Screenshot**: Settings → SMS permission toggle, notification example

> 🎥 **Video recommended**: Record the full SMS detection flow — receive SMS → notification appears → tap → review inbox → edit → save. This requires an Android device and a test SMS. (≈60 seconds)

---

## SMS Review Inbox

The SMS Review Inbox collects all auto-detected SMS transactions waiting for your review.

### How to access

- Tap the **📨 envelope icon** in the header bar (shows a count badge)
- Or open the **drawer menu → SMS Review**

### What you see

Each pending SMS appears as a card showing:
- **Parsed amount** and currency
- **Date** extracted from the message
- **Payee/merchant** if detected
- **Sender** (bank name)

### Actions

- **Review** → Opens the Edit Transaction screen with pre-filled data
- **Ignore** → Removes the item from your inbox

> 📸 **Screenshot**: SMS Review Inbox with 2-3 items, empty state

> 🎥 **Video recommended**: Record reviewing multiple SMS items — review one, ignore another, show badge count updating (≈30 seconds)

---

## Editing a Transaction

When you review a parsed transaction, you'll see the Edit screen:

### Field Confidence Indicators

Xpensia shows how confident it is about each parsed field:

- 🟢 **Detected** — High confidence, extracted directly from the text
- 🟡 **Suggested** — Medium confidence, inferred from patterns
- 🔴 **Needs Review** — Low confidence, please verify

### Editable Fields

- **Title** — Transaction name or merchant
- **Amount** — Transaction amount
- **Currency** — Currency code
- **Type** — Income, Expense, or Transfer
- **Category** — Spending category (Food, Transport, etc.)
- **Subcategory** — More specific category
- **Account** — Which account/card was used
- **Date** — Transaction date
- **Notes** — Optional notes

### Saving

When you tap **Save**:
- The transaction is stored
- Xpensia **learns from your corrections** — next time a similar SMS arrives, it will parse more accurately

> 📸 **Screenshot**: Edit screen with confidence labels visible, category selector open

---

## Viewing Your Transactions

The **Transactions** screen shows all your recorded transactions.

### Features

- **Grouped by date** — Transactions organized chronologically
- **Search** — Find transactions by title, category, or notes
- **Type filter** — Show only income, expenses, or all
- **Date range filter** — Filter by week, month, year, or custom range
- **Tap to edit** — Tap any transaction to modify it
- **Delete** — Remove transactions you no longer need

> 📸 **Screenshot**: Transaction list with filters applied, search active

---

## Analytics & Reports

The **Analytics** screen gives you visual insights into your spending:

### Charts Available

- **Category breakdown** — Bar chart of spending by category
- **Subcategory drill-down** — Expand categories for detail
- **Timeline chart** — Spending over time (daily/weekly/monthly)
- **Net balance chart** — Income vs expenses trend

### Controls

- **Period selector** — Week, month, year, or custom range
- **Currency aggregation** — Totals in your default currency with FX conversion

> 📸 **Screenshot**: Category chart, timeline chart, period selector

---

## Budgets

Create and track budgets for different spending categories.

### How to use

1. Go to **Budget** (drawer menu)
2. Tap **Set Budget** to create a new budget
3. Choose a category and set a limit
4. Track your progress on the **Budget Report** screen
5. View recommendations on the **Budget Insights** screen

### Budget Alerts

When spending approaches your budget limit, Xpensia alerts you.

> 📸 **Screenshot**: Budget hub, set budget form, budget report

> 🎥 **Video recommended**: Record creating a budget → adding transactions → seeing progress update → viewing report (≈45 seconds)

---

## Exchange Rates

If you use multiple currencies, manage exchange rates here:

1. Go to **Exchange Rates** (drawer menu)
2. View current rates
3. Edit any rate manually
4. Dashboard totals will use your custom rates for FX conversion

> 📸 **Screenshot**: Exchange rates screen

---

## Settings

Manage your app preferences in **Settings** (drawer menu):

| Setting | Description |
|---|---|
| **Theme** | Switch between light and dark mode |
| **Default Currency** | Change your primary currency |
| **Week Start Day** | Choose which day starts your week |
| **Background SMS** | Enable/disable SMS auto-detection (Android) |
| **SMS Permissions** | Manage SMS read permissions (Android) |
| **Export CSV** | Download all transactions as a spreadsheet |
| **Export JSON** | Download all data as a JSON backup |
| **Import Data** | Restore from a CSV or JSON file |
| **Reset All Data** | Clear all transactions and settings (⚠️ irreversible) |

> 📸 **Screenshot**: Full settings page

---

## Profile

Manage your personal information:

1. Go to **Profile** (drawer menu)
2. Edit your **name** and **email**
3. Tap the **camera icon** to take or change your profile photo
4. Delete your photo to return to initials avatar

> 📸 **Screenshot**: Profile page

---

## Sharing Text from Other Apps

*Android only*

You can share text directly from any app to Xpensia:

1. In any app (SMS, WhatsApp, email), **select and copy** text or use the **Share** button
2. Choose **Xpensia** from the share menu
3. The Smart Entry screen opens with the text pre-filled
4. Submit to parse and review

> 🎥 **Video recommended**: Record sharing text from SMS app → Xpensia opens → parses → save (≈30 seconds)

---

## Tips & Tricks

1. **The more you correct, the smarter it gets** — Xpensia learns from every transaction you confirm or edit
2. **Use voice for quick entries** — Say "I spent 50 riyals on lunch" and let Xpensia handle the rest
3. **Check the SMS inbox badge** — The number on the envelope icon shows how many SMS are waiting for review
4. **Export regularly** — Use Settings → Export to back up your data
5. **Set budgets for top categories** — Track your biggest spending areas
6. **Custom exchange rates** — If your bank uses different rates, set them manually for accurate totals
