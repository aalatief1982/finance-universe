## Plan: Optimize Android SpeechRecognizer for Better Voice Transcription

### Status: ✅ Implemented

### What was changed

**`SpeechToTextPlugin.java`** — Native Android plugin
- On-device recognizer via `createOnDeviceSpeechRecognizer()` for API 31+ (Android 12+), fallback to `createSpeechRecognizer()` for older devices
- Added `EXTRA_PREFER_OFFLINE = true` for offline-first recognition
- Increased `EXTRA_MAX_RESULTS` from 1 to 5
- Extracts `CONFIDENCE_SCORES`, picks highest-confidence alternative
- Returns `{ text, confidence, isFinal }` to JS bridge

**`src/plugins/SpeechToTextPlugin.ts`** — TypeScript bridge
- Added `confidence: number` to `speechResult` event type

**`src/hooks/useSpeechToText.ts`** — React hook
- Added `minConfidence` option (default `0.35`)
- Discards low-confidence results with user-friendly toast
- Dev-mode debug logging for transcript + confidence

**`src/i18n/en.ts` + `src/i18n/ar.ts`** — Added `voice.lowConfidence` translation key

### What is NOT changed
- SmartPaste parser, SMS parsing, category detection — untouched
- Home.tsx, MicButton.tsx — no UI changes
- Web Speech API fallback — unchanged

### Post-build steps
1. `git pull` → `npx cap sync` → `npx cap run android`

### Known limitations
- `createOnDeviceSpeechRecognizer` only on API 31+ (Android 12+)
- Some devices may not return confidence scores (defaults to 1.0)
- Offline language packs must be downloaded manually via Android Settings
- Mixed Arabic/English accuracy depends on active language model
