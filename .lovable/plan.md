

# Two GitHub Actions Workflows (Manual Trigger Only)

Both workflows use `workflow_dispatch` (manual trigger only) -- they will **never** run automatically on push. You trigger them from GitHub by going to Actions, selecting the workflow, and clicking "Run workflow".

---

## Workflow 1: Build Debug APK

**File to create:** `.github/workflows/build-debug-apk.yml`

### What it does
1. Checks out your full repo (including local plugins `capacitor-background-sms-listener` and `capacitor-sms-reader`)
2. Sets up Node 20 and JDK 17
3. Runs `npm ci` and `npm run build`
4. Writes `google-services.json` from a GitHub secret
5. Runs `npx cap sync android`
6. Runs `./gradlew assembleDebug`
7. Uploads the debug APK as a downloadable artifact

### One-time setup required (on GitHub)
Go to your repo on GitHub, then Settings, then Secrets and variables, then Actions, and add:

| Secret Name | What to put |
|---|---|
| `GOOGLE_SERVICES_JSON` | Copy-paste the entire contents of `android/app/google-services.json` |

### How to use
1. Go to your GitHub repo
2. Click **Actions** tab
3. Click **Build Debug APK** on the left
4. Click **Run workflow** button
5. Wait about 5-10 minutes
6. Download the APK from the **Artifacts** section of the completed run

---

## Workflow 2: Deploy OTA Update

**File to create:** `.github/workflows/deploy-ota.yml`

This replaces `deploy_OTA.bat` entirely -- no local machine needed.

### What it does
1. Checks out your full repo
2. Sets up Node 20
3. Runs `npm ci` and `npm run build`
4. Creates `www.zip` from `dist/` using Capgo CLI
5. Computes SHA256 checksum of the zip
6. Auto-increments the patch version in `public/manifest.json` (e.g., 1.0.2 becomes 1.0.3)
7. Updates the checksum in `manifest.json`
8. Deploys to Firebase Hosting
9. Commits the updated `manifest.json` back to the repo so it stays in sync

### One-time setup required (on GitHub)
Add these secrets (same Settings, then Secrets location):

| Secret Name | What to put | How to get it |
|---|---|---|
| `FIREBASE_TOKEN` | Firebase CI token | Run `firebase login:ci` on your local machine once -- it prints a token |

### How to use
1. Make your changes in Lovable (they auto-push to GitHub)
2. Go to your GitHub repo, then Actions tab
3. Click **Deploy OTA Update** on the left
4. Click **Run workflow**
5. Wait about 3-5 minutes
6. Done -- users get the update on next app launch

### Workflow steps in detail

```text
Manual trigger
    |
    v
Checkout --> npm ci --> npm run build
    |
    v
npx @capgo/cli bundle zip --path dist
    |
    v
Find the generated zip --> move to public/www.zip
    |
    v
Compute SHA256 of www.zip
    |
    v
Update public/manifest.json:
  - Bump version (1.0.2 -> 1.0.3)
  - Set new checksum
    |
    v
firebase deploy --token $FIREBASE_TOKEN
    |
    v
git commit + push updated manifest.json
```

---

## Files to Create

| File | Purpose |
|---|---|
| `.github/workflows/build-debug-apk.yml` | Manual debug APK build in the cloud |
| `.github/workflows/deploy-ota.yml` | Manual OTA deployment (replaces deploy_OTA.bat) |

## Secrets to Add on GitHub (One-Time)

| Secret | Used by |
|---|---|
| `GOOGLE_SERVICES_JSON` | Debug APK workflow |
| `FIREBASE_TOKEN` | OTA deploy workflow |

## Important Notes

- Neither workflow runs automatically -- both require you to manually click "Run workflow"
- The OTA workflow commits the updated `manifest.json` back to your repo, so Lovable stays in sync
- The debug APK uses Android's default debug signing key (not your release keystore), so it cannot be uploaded to the Play Store -- it is for testing only
- Your existing `deploy_OTA.bat` still works if you prefer to run it locally sometimes

