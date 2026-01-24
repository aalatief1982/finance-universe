# Capgo OTA Investigation (Repo-specific)

This document summarizes the current Capgo OTA implementation in this repository, highlights blockers, and documents the existing update flow and publish steps based on the codebase.

## Key Findings

- Capgo is integrated via the `@capgo/capacitor-updater` plugin and a custom manifest fetched from Firebase Hosting.
- Updates are triggered via a `useAppUpdate` hook and applied via `AppUpdateService`.
- The current native app version in Android (`versionName`) is higher than the manifest versions in the repo, which will prevent updates from being marked as available.
- A repo-local publish script (`scripts/publish-capgo.sh`) now automates building, zipping, and manifest updates.

## Current Update Flow (Code Map)

1. App startup initializes Capgo updater and begins periodic update checks via `useAppUpdate`.
2. `AppUpdateService` fetches the manifest, compares versions, and returns an update status.
3. If an update is available, `UpdateDialog` allows the user to download and apply it.
4. Capgo downloads the bundle and applies it via `set()`.

## Blocking Issues

- **Runtime:** The manifest version in the repo (`updates/manifest.json` and `public/manifest.json`) is lower than the Android native version (`android/app/build.gradle`). This prevents updates from showing as available.
- **Publishing Workflow:** A local publish script exists, but deployment to hosting is still manual.

## Publish Checklist (Based on Repo State)

1. Run `npm run capgo:publish -- <version> [zip-url]` to build, zip, and update manifest files.
2. Upload `public/manifest.json` and `public/www.zip` to your hosting (Firebase Hosting uses `public/` by default).
3. Verify on device by opening Settings and checking the displayed app version, then trigger update checks.

> Note: The publish script does not deploy to hosting; it prepares artifacts for upload.
