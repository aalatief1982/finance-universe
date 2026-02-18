# Phase 7 Pack — Release Preparation (Reverse-Engineered)

**Release channel question (required):** What is the intended release channel right now — (A) Internal APK only, (B) Play Store closed testing, (C) Play Store production, (D) iOS TestFlight?  
**Working assumption used for this pack:** derive from repo/config → **Android-first with Internal APK + Play Store Closed Testing readiness** (**INFERRED, LOW CONFIDENCE**).

## 1) Release Readiness Checklist

### 1.1 P0 (Must-pass before release)

- [ ] **(Release Manager)** Confirm target track decision (A/B/C/D) is explicitly approved in release ticket. **OPEN QUESTION** (repo has debug APK CI and Android release signing, but no store track automation).
- [ ] **(Android Lead)** Remove hardcoded signing secrets from tracked files and rotate compromised keys; keep secrets in CI/secure local properties only. Evidence: signing passwords and keystore filename are in `android/gradle.properties`; release config consumes these fields. 
- [ ] **(Android Lead)** Ensure release keystore file is not committed and is available via secure pipeline path only. Evidence: tracked keystore exists in `android/app/my-release-key.jks`; release uses `MYAPP_UPLOAD_*` variables.
- [ ] **(Android Lead)** Build signed release artifact (`assembleRelease` and/or `bundleRelease`) from clean checkout and archive SHA/hash + mapping files. Evidence: release buildType uses `minifyEnabled true`, `shrinkResources true`, and signingConfig.
- [ ] **(QA Lead)** Pass CI quality gate on release commit (`lint`, `test:coverage`, `build`). Evidence: `.github/workflows/ci.yml` runs these checks on PR/push.
- [ ] **(Android Lead)** Validate runtime SMS permission flow (`READ_SMS`, `RECEIVE_SMS`) before enabling SMS features in release notes/store declaration. Evidence: Android manifest + plugin permission annotations + permission service request/check methods.
- [ ] **(Android Lead)** Validate Android 13+ notification permission path if any user-visible notifications are used, or explicitly confirm none required. **OPEN QUESTION** (no `POST_NOTIFICATIONS` permission found).
- [ ] **(Security/Privacy Owner)** Finalize Play “SMS/Call Log” declarations and least-privilege rationale for `READ_SMS`/`RECEIVE_SMS`.
- [ ] **(Backend/Integrations Owner)** Verify production endpoints and telemetry destinations are intended (`Supabase`, Firebase Analytics, Google Sheets logging, cloud functions URL).
- [ ] **(Data Owner)** Run export/import smoke for transaction backup before rollout due heavy local persistence.
- [ ] **(SRE/On-call)** Establish incident channel + named release commander + rollback approver for release window. **OPEN QUESTION** (no on-call config in repo).

### 1.2 P1 (Should-pass before release)

- [ ] **(Android Lead)** Produce deterministic build runbook (Node 20, JDK 17, `npm ci`, `npm run build`, `npx cap sync android`, Gradle build task).
- [ ] **(Release Manager)** Attach store listing asset pack (icon, screenshots, short/full description, privacy URLs, support contact). **OPEN QUESTION** for final media set.
- [ ] **(QA Lead)** Validate OTA update path with non-mandatory and mandatory manifest scenarios before production enablement.
- [ ] **(Data Owner)** Verify migration idempotency for startup migrations and legacy transaction compatibility.
- [ ] **(Analytics Owner)** Freeze minimum monitoring dashboard using events documented in `docs/ANALYTICS_EVENTS.md`.
- [ ] **(Security Owner)** Review `allowBackup=true` impact and decide if backup policy should be constrained.
- [ ] **(Android Lead)** Document `google-services.json` provisioning source and environment-specific handling.
- [ ] **(Release Manager)** Create final Go/No-Go checklist sign-off record with artifact IDs.

## 2) Build & Versioning Plan

### 2.1 Versioning rules (versionName/versionCode or equivalent)

- Android native app currently uses `versionCode 6` and `versionName "1.0.6"` in `android/app/build.gradle`.
- Rule: increment `versionCode` on every Play upload; align `versionName` with release notes tag.
- OTA manifest version is independently bumped in `deploy-ota.yml` by incrementing patch component of `public/manifest.json` (**separate from native version**).

### 2.2 Build variants (debug/release)

- Debug variant is CI-built via `./gradlew assembleDebug` and uploaded as artifact (`app-debug.apk`).
- Release variant defined in Gradle with shrink/minify + signing. No release CI workflow found (**OPEN QUESTION** for automated release build).

### 2.3 Signing requirements (placeholders only)

Required release signing inputs (do not commit values):

- `MYAPP_UPLOAD_STORE_FILE=<path-to-upload-keystore>`
- `MYAPP_UPLOAD_KEY_ALIAS=<alias>`
- `MYAPP_UPLOAD_STORE_PASSWORD=<secret>`
- `MYAPP_UPLOAD_KEY_PASSWORD=<secret>`

These are consumed by `android.app.build.gradle` `signingConfigs.release`.

### 2.4 Artifact outputs (APK/AAB/IPA) and where generated

- Debug APK: `android/app/build/outputs/apk/debug/app-debug.apk` (from CI workflow).
- Release APK (expected): `android/app/build/outputs/apk/release/` via `assembleRelease` (**INFERRED**).
- Release AAB (expected/recommended for Play): `android/app/build/outputs/bundle/release/` via `bundleRelease` (**INFERRED**, no explicit repo script).
- iOS IPA: **N/A currently** (no `ios/` project directory present).

### 2.5 Reproducible build steps (command sequence)

```bash
npm ci
npm run build
npx cap sync android
cd android
chmod +x gradlew
./gradlew clean
./gradlew assembleDebug
./gradlew assembleRelease   # or ./gradlew bundleRelease for Play AAB
```

## 3) Store Publishing Pack

### 3.1 Store listing assets checklist

**Play Store (required metadata checklist):**

- [ ] App name, short description, full description.
- [ ] App icon (512x512), feature graphic.
- [ ] Phone screenshots (and tablet if claimed support).
- [ ] Privacy policy URL.
- [ ] Data safety form completed (see 3.3).
- [ ] Contact email/website.
- [ ] Content rating questionnaire.
- [ ] SMS permissions declaration form (`READ_SMS`/`RECEIVE_SMS`) with feature rationale.
- [ ] Target SDK policy compliance confirmation (target SDK 35 currently).

**iOS (optional):** **OPEN QUESTION / N/A for now** (no iOS project files).

### 3.2 Permissions justification matrix

| Permission | Why needed | Feature dependency | Evidence |
|---|---|---|---|
| `android.permission.READ_SMS` | Read inbox SMS content for transaction import/parsing. | Manual SMS import and parser pipeline. | Android manifest + SMS Reader plugin queries `Telephony.Sms.Inbox`. |
| `android.permission.RECEIVE_SMS` | Listen for incoming SMS to support background/auto import behavior. | Background SMS listener plugin receiver and permission requests. | Android manifest + Background listener plugin permission annotation and broadcast receiver. |
| `android.permission.FOREGROUND_SERVICE` | Declared for service-style background operations related to SMS flow. | Background SMS capability (current implementation shows receiver-based handling). | Main Android manifest and project documentation mention requirement. |
| `android.permission.FOREGROUND_SERVICE_DATA_SYNC` | Foreground data-sync service capability for Android modern restrictions. | Background SMS listener plugin manifest declaration. | Main manifest + plugin manifest. |
| `android.permission.ACCESS_NETWORK_STATE` | Detect network state for sync/telemetry/update decisions. | Network-aware features and remote services. | Main manifest + manifest additions file. |
| `android.permission.INTERNET` | Remote API calls (Firebase/Supabase/Cloud Functions/OTA manifest). | Analytics, backend calls, OTA update checks. | Main manifest + config/service files for endpoints. |

**Android 13+ notifications check:** `POST_NOTIFICATIONS` permission not found. If app displays notifications, add runtime flow; otherwise record “not used”.

### 3.3 Privacy/Data handling summary (high-level, evidence-based)

- Transaction and app data are primarily persisted locally using `safeStorage`/`localStorage` keys such as `xpensia_transactions` and related settings.
- App can export/import transactions via CSV/JSON from settings.
- Data leaves device for: Firebase Analytics, Google Sheets telemetry logging, Supabase (when configured), and cloud function endpoints.
- SMS content is accessed via native SMS reader plugin and receiver permissions.
- `allowBackup="true"` is enabled in Android manifest (backup implications must be reviewed).

### 3.4 Compliance checks (track-specific)

- **Internal track:** verify signed debug/release installability and consent copy for SMS permissions.
- **Closed testing:** ensure Play declarations for SMS permissions are accepted before widening testers.
- **Production:** require stable crash/error trend and no unresolved P0 data-loss issues (see sections 5 and 6).
- **OPEN QUESTION:** existing legal/privacy text readiness for store submission not present in repo.

## 4) Rollout Strategy

### 4.1 Track strategy (internal/closed/production)

1. **Internal APK** (or Play Internal): release candidate smoke with team devices.
2. **Play Closed Testing**: limited tester cohort validating SMS import, onboarding, transaction CRUD, export/import, OTA behavior.
3. **Production**: after closed test stability window and Go/No-Go approval.

### 4.2 Staged rollout plan (percentages + gates)

- Stage 0: Internal only (100% of internal testers).
- Stage 1: Closed testing track (100% testers).
- Stage 2: Production 5% for 24h.
- Stage 3: 20% for 24–48h.
- Stage 4: 50% for 24–48h.
- Stage 5: 100% when error/crash and key flow metrics are stable.

**Gate to next stage:** no P0 defects; no severe spike in `app_error` telemetry; key completion events (`sms_import_complete`, `transaction_add`) remain within expected baseline.

### 4.3 Go/No-Go criteria

**Go** when:
- Release artifact signed and reproducible from clean commit.
- CI quality gates green.
- Permission declaration approved (especially SMS).
- Monitoring dashboard + on-call ownership confirmed.

**No-Go** when:
- Signing/secrets unmanaged or leaked.
- SMS permission rationale/declaration unresolved.
- P0 data integrity defects open.

### 4.4 Communication plan (who gets notified)

- Release Manager: launch/start/stop calls.
- Android Lead: build/signing status + hotfix ownership.
- QA Lead: verification sign-off and bug triage.
- Data/Analytics Owner: telemetry watch.
- Support/Operations: user-facing incident updates.

(Channels/tools are **OPEN QUESTION**; not defined in repo.)

## 5) Monitoring & Incident Response

### 5.1 What to monitor (crashes, ANRs, key flows)

- Error boundary `app_error` events (Google Sheets sink) for front-end crash surfaces.
- Firebase Analytics key funnel events: onboarding, transaction add/edit/delete, SMS import completion, permission outcomes, OTA apply/download.
- Build/deploy health: CI workflow status for lint/tests/build and APK generation.
- OTA manifest/version progression if OTA is used.

### 5.2 Metrics and thresholds (measurable)

Because explicit alert tooling is not configured in repo, thresholds are operational targets (**OPEN QUESTION for automation**):

- `app_error` event rate > 2% sessions in any 1h window → investigate immediately.
- `sms_import_complete` drops > 30% day-over-day after release → halt rollout.
- `sms_permission_request_failed` or timeout events > 10% of permission attempts → block promotion.
- OTA failure trend (`ota_update_downloaded` without `ota_update_applied`) > 5% → pause OTA/public rollout.

### 5.3 Incident playbook (triage steps, escalation, hotfix criteria)

1. Declare incident owner + severity.
2. Freeze rollout (halt staged percentage increase or pause production release in Play Console).
3. Pull evidence: recent `app_error` payloads, affected app version, track, device/OS.
4. Classify issue:
   - Permission/OS regression
   - Data integrity (transactions/import/export)
   - OTA delivery/update issue
   - Service integration failure (Supabase/Firebase/Functions)
5. Hotfix criteria: reproducible high-severity user impact, especially data loss/corruption or critical onboarding/import failure.
6. Decision:
   - Fast-follow patch build OR rollback to last known good track version.
7. Communicate status every 30–60 min until mitigated.

## 6) Rollback Plan

### 6.1 Rollback triggers

- P0 data corruption/loss in transaction storage or migration failures.
- Severe permission regression causing core SMS import flow failure.
- Sustained high `app_error` rate after rollout stage gate.
- OTA bundle instability after activation.

### 6.2 Rollback steps (store + build + config)

1. **Store rollback:** halt staged rollout immediately; if needed, unpublish latest release and promote previous stable build in Play Console.
2. **Binary rollback:** rebuild/install previous Git tag/commit with known `versionCode/versionName` lineage.
3. **Config rollback:** revert OTA manifest (`public/manifest.json`) to last known good version/checksum and redeploy hosting.
4. **Validation:** install rollback build on clean device; verify onboarding, transaction create/edit, SMS permission/import, and export/import.

### 6.3 Data integrity considerations

- App persists critical data locally (`localStorage`/Preferences), so advise users/testers to export data (CSV/JSON) before major upgrades.
- Startup migrations should remain idempotent and one-time guarded (`xpensia_migrations_applied`).
- Because rollback may not reverse local schema/state transformations, include pre-release backup guidance in test cohort instructions.

## 7) Release Notes Template

```markdown
## Xpensia v<versionName> (<versionCode>)
Release date: <YYYY-MM-DD>
Track: <Internal | Closed Testing | Production>

### What’s new
- <Feature/improvement 1>
- <Feature/improvement 2>

### Fixes
- <Bug fix 1>
- <Bug fix 2>

### Permissions & Privacy
- Uses SMS permissions (`READ_SMS`, `RECEIVE_SMS`) to import transaction messages.
- No changes to <privacy/data handling> OR describe changes.

### Known issues
- <Known issue or “None known”>

### Rollback reference
- Last known good version: <version>
- Incident contact: <owner/channel>
```

## 8) Evidence Appendix

- Build tooling/scripts → `package.json` scripts (`build`, `test:coverage`, plugin prep), `scripts/build-plugins.sh`, `scripts/publish-capgo.sh`, `.github/workflows/ci.yml`, `.github/workflows/build-debug-apk.yml`, `.github/workflows/deploy-ota.yml`.
- Android app ID/version/signing/build types → `android/app/build.gradle` (`applicationId`, `versionCode`, `versionName`, `signingConfigs.release`, `buildTypes.release`).
- SDK levels → `android/variables.gradle` (`minSdkVersion`, `targetSdkVersion`, `compileSdkVersion`).
- Permissions and receivers → `android/app/src/main/AndroidManifest.xml`, `android-manifest-additions.xml`, `capacitor-background-sms-listener/android/src/main/AndroidManifest.xml`, `capacitor-sms-reader/plugin.xml`.
- Runtime permission implementations → `capacitor-sms-reader/android/src/main/java/com/xpensia/plugins/smsreader/SmsReaderPlugin.java`, `capacitor-background-sms-listener/android/src/main/java/app/xpensia/com/plugins/backgroundsmslistener/BackgroundSmsListenerPlugin.java`, `src/services/SmsPermissionService.ts`.
- Data storage and backup/export/import surface → `src/utils/safe-storage.ts`, `src/utils/storage-utils.ts`, `src/components/settings/DataManagementSettings.tsx`, `src/utils/migration/runMigrations.ts`.
- Telemetry/monitoring surface → `src/utils/firebase-analytics.ts`, `docs/ANALYTICS_EVENTS.md`, `src/components/ErrorBoundary.tsx`.
- Endpoint/config dependencies → `capacitor.config.ts`, `src/lib/env.ts`, `src/lib/supabase.ts`, `src/firebase-config.ts`.
- iOS applicability check → no `ios/` directory found in repository root.
