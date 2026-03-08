## Plan: Voice Capture for Smart Entry (Android Native)

### Status: ✅ Implemented

### What was built
- **Native Android plugin** (`SpeechToTextPlugin.java`) wrapping `android.speech.SpeechRecognizer`
- **TypeScript bridge** (`src/plugins/SpeechToTextPlugin.ts`)
- **React hook** (`src/hooks/useSpeechToText.ts`) with Web Speech API fallback for browser preview
- **MicButton component** (`src/components/smart-paste/MicButton.tsx`) with pulsing animation
- **Home page**: Mic FAB above the + FAB, navigates to Smart Entry with transcript
- **Smart Entry page**: Mic button next to "Transaction details" label, appends transcript to textarea
- **i18n**: Arabic + English voice error messages

### Post-build steps (required)
1. `git pull` the project
2. `npx cap sync` to sync native plugin
3. `npx cap run android` to test on device

### Files created
- `android/app/src/main/java/app/xpensia/com/plugins/speechtotext/SpeechToTextPlugin.java`
- `src/plugins/SpeechToTextPlugin.ts`
- `src/hooks/useSpeechToText.ts`
- `src/components/smart-paste/MicButton.tsx`

### Files modified
- `android/app/src/main/java/app/xpensia/com/MainActivity.java` — registered SpeechToTextPlugin
- `src/components/SmartPaste.tsx` — added MicButton to textarea
- `src/pages/Home.tsx` — added mic FAB with speech hook
- `src/pages/ImportTransactions.tsx` — reads `voiceTranscript` from navigation state
- `src/i18n/en.ts` / `src/i18n/ar.ts` — added voice.* keys
