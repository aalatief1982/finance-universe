# Capgo OTA Investigation (Repo-specific)

This document summarizes the current Capgo OTA implementation in this repository, highlights blockers, and documents the existing update flow and publish steps based on the codebase.

## Key Findings

- Capgo is integrated via the `@capgo/capacitor-updater` plugin and a custom manifest fetched from Firebase Hosting.
- Updates are triggered via a `useAppUpdate` hook and applied via `AppUpdateService`.
- The current native app version in Android (`versionName`) is higher than the manifest versions in the repo, which will prevent updates from being marked as available.

- There is no Capgo CLI publish script or documentation in this repo; publishing steps must be manual or added separately.


## Current Update Flow (Code Map)

1. App startup initializes Capgo updater and begins periodic update checks via `useAppUpdate`.
2. `AppUpdateService` fetches the manifest, compares versions, and returns an update status.
3. If an update is available, `UpdateDialog` allows the user to download and apply it.
4. Capgo downloads the bundle and applies it via `set()`.

## Blocking Issues

- **Runtime:** The manifest version in the repo (`updates/manifest.json` and `public/manifest.json`) is lower than the Android native version (`android/app/build.gradle`). This prevents updates from showing as available.

- **Publishing Workflow:** No Capgo CLI scripts or documented publish process exist in this repo.

## Publish Checklist (Based on Repo State)

1. Build the web bundle with `npm run build` (produces `dist/`).
2. Package and upload the bundle to your hosting (e.g., Firebase Hosting) as `www.zip`.
3. Update the hosted `manifest.json` with a `version` higher than the native app version and the correct `url`.
4. Verify on device by opening Settings and checking the displayed app version, then trigger update checks.

> Note: This repo does **not** include Capgo CLI automation; add scripts if you want a repeatable publish workflow.

