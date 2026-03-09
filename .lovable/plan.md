

## Plan: Optimize Android SpeechRecognizer for Better Voice Transcription

### Phase 1 — Current Implementation Audit (Complete)

**Runtime flow:** Mic tap → `useSpeechToText.startListening()` → permission check → `SpeechToText.startListening({ locale })` → Java plugin creates `SpeechRecognizer.createSpeechRecognizer(context)` → `RecognitionListener` callbacks → `notifyListeners("speechResult", ...)` → hook receives text → `onResult` callback inserts into Smart Entry textbox.

**Current gaps identified:**
- Always uses cloud-capable `createSpeechRecognizer()` — never forces on-device
- `EXTRA_PREFER_OFFLINE` not set
- `EXTRA_MAX_RESULTS = 1` — no alternatives considered
- No confidence scores extracted or returned
- No quality filtering on transcript results

### Phase 2-4 — Implementation Plan

Three files modified, no other files touched.

---

**File 1: `SpeechToTextPlugin.java`** — Native Android plugin

Changes:
1. Add `import android.os.Build;` for API level check
2. Recognizer creation: if `Build.VERSION.SDK_INT >= 31`, use `SpeechRecognizer.createOnDeviceSpeechRecognizer(context)`, else fallback to `createSpeechRecognizer(context)`
3. Add `EXTRA_PREFER_OFFLINE = true` to intent
4. Change `EXTRA_MAX_RESULTS` from 1 to 5
5. In `onResults()`: read `CONFIDENCE_SCORES` float array, iterate all alternatives, pick highest-confidence result, return `{ text, confidence, isFinal }` — default confidence to 1.0 if scores unavailable
6. In `onPartialResults()`: no change (partial results don't have confidence)

---

**File 2: `src/plugins/SpeechToTextPlugin.ts`** — TypeScript bridge

Change `speechResult` event type:
```
{ text: string; isFinal: boolean; confidence: number }
```
`confidence` added as required field (Java always sends it).

---

**File 3: `src/hooks/useSpeechToText.ts`** — React hook

Changes:
1. Add `minConfidence` option to `UseSpeechToTextOptions` (default `0.35`)
2. Add `voice.lowConfidence` translation key usage
3. In native `speechResult` handler: if `data.isFinal && data.confidence < minConfidence`, discard result, show "try again" toast, don't call `onResult`
4. Add `console.log` in dev mode for transcript + confidence debugging

---

**File 4: `src/i18n/en.ts` + `src/i18n/ar.ts`** — Add one translation key each

- `voice.lowConfidence`: "Could not understand clearly. Please try again." / Arabic equivalent

### What is NOT changed
- `SmartPaste.tsx`, `Home.tsx`, `MicButton.tsx` — no UI changes needed
- Smart Entry parser, SMS parsing, category detection — untouched
- Web Speech API fallback path — unchanged (no confidence available there)

### Known limitations
- On-device recognizer quality varies by device manufacturer
- `createOnDeviceSpeechRecognizer` only available on API 31+ (Android 12+); older devices use standard recognizer with `EXTRA_PREFER_OFFLINE`
- Mixed Arabic/English in a single utterance: accuracy depends on which language model is active
- Users must download offline language packs manually (Android Settings → Google → Voice)
- Some devices may not return confidence scores (we default to 1.0 in that case)

### Post-build steps
1. `git pull` → `npx cap sync` → `npx cap run android`

