

## Voice Capture for Android — Updated Plan

### The Problem with Web Speech API on Android

The Web Speech API (`webkitSpeechRecognition`) does **not work** in Capacitor's Android WebView (it requires Chrome browser, not a WebView). For actual Android devices, we need a **native Capacitor plugin** that calls Android's built-in `SpeechRecognizer` API.

### Approach: Custom Local Capacitor Plugin

Following the same pattern as your existing local plugins (`BackgroundSmsListener`, `SmsReader`, `ShareTarget`, `AndroidSettings`), we create a local `SpeechToText` Capacitor plugin that wraps Android's native `android.speech.SpeechRecognizer`.

### Files to Create

**Native Android (Java):**

| File | Purpose |
|------|---------|
| `android/app/src/main/java/app/xpensia/com/plugins/speechtotext/SpeechToTextPlugin.java` | Capacitor plugin class — exposes `startListening(locale)` and `stopListening()` methods. Fires `partialResult` and `finalResult` events. Handles `RECORD_AUDIO` permission. |

**TypeScript plugin bridge:**

| File | Purpose |
|------|---------|
| `src/plugins/SpeechToTextPlugin.ts` | `registerPlugin('SpeechToText')` — typed interface for `startListening`, `stopListening`, `addListener` |

**React hook + UI:**

| File | Purpose |
|------|---------|
| `src/hooks/useSpeechToText.ts` | Hook wrapping the plugin. Returns `{ startListening, stopListening, isListening, isSupported }`. Accepts `onResult` callback. Maps app language (`ar` → `ar-SA`, `en` → `en-US`). Web fallback: uses Web Speech API for browser preview. |
| `src/components/smart-paste/MicButton.tsx` | Mic icon button with pulsing animation when listening. Tap to start, tap again to stop. |

### Files to Modify

| File | Change |
|------|--------|
| `android/.../MainActivity.java` | Add `registerPlugin(SpeechToTextPlugin.class)` before `super.onCreate()` |
| `src/components/SmartPaste.tsx` | Add `MicButton` next to Textarea. On result → `setText(prev => prev + ' ' + transcript)`. Zero changes to parsing logic. |
| `src/pages/ImportTransactions.tsx` | Read `voiceTranscript` from `location.state`, pass as `prefillText` to SmartPaste |
| `src/pages/Home.tsx` | Add mic FAB. On result → `navigate('/import-transactions', { state: { voiceTranscript } })` |
| `src/i18n/en.ts` / `src/i18n/ar.ts` | Add ~5 keys for mic-related toasts/labels |

### Native Plugin Design (Java)

```text
SpeechToTextPlugin.java
├── @PluginMethod startListening(call)
│   ├── Check/request RECORD_AUDIO permission
│   ├── Create SpeechRecognizer with locale from call args
│   ├── Set RecognitionListener
│   │   ├── onResults → notifyListeners("result", { text, isFinal: true })
│   │   ├── onPartialResults → notifyListeners("result", { text, isFinal: false })
│   │   └── onError → notifyListeners("error", { message })
│   └── recognizer.startListening(intent)
├── @PluginMethod stopListening(call)
│   └── recognizer.stopListening()
└── onDestroy → recognizer.destroy()
```

### Navigation Flow (Home Mic)

1. User taps mic FAB on Home
2. `useSpeechToText` starts native recognition
3. On final result → `navigate('/import-transactions', { state: { voiceTranscript: text } })`
4. `ImportTransactions` reads `voiceTranscript` from state, sets it as `pendingSharedText`
5. SmartPaste receives it via existing `prefillText` prop — no new logic needed

### Permission Handling

- `RECORD_AUDIO` requested only on first mic tap (via Capacitor's `@Permission` annotation)
- If denied → toast: "Microphone permission required for voice input"
- Plugin checks permission before each `startListening` call

### Error Handling

| Error | UX |
|-------|-----|
| Permission denied | Toast with option to open settings (reuse existing `openAndroidAppPermissionsSettings`) |
| No speech detected | Toast: "No speech detected. Try again." |
| Recognition error | Toast: "Voice recognition failed. Try typing instead." |
| Not on native platform | Mic button hidden (or falls back to Web Speech API for browser testing) |

### Web Preview Fallback

The `useSpeechToText` hook detects platform:
- **Native Android**: Uses the Capacitor plugin
- **Web browser**: Falls back to `webkitSpeechRecognition` (works in Chrome for dev/preview)
- **Unsupported**: `isSupported = false`, mic button hidden

### What Does NOT Change

- SmartPaste parsing logic — untouched
- `parseAndInferTransaction` — untouched
- Review flow — untouched
- No audio stored — Android SpeechRecognizer handles everything in-memory
- No AI inference — raw text only

