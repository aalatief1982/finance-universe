# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/44f11ecc-0e77-4a7d-a302-6102d5d50c2b

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/44f11ecc-0e77-4a7d-a302-6102d5d50c2b) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

Install Node.js (version 18 or later; this project is tested with Node.js v22) and npm. We recommend using [nvm](https://github.com/nvm-sh/nvm#installing-and-updating) for installation.

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev

# Step 5: Run the linter to check code quality.
npm run lint

# Step 6: Build the production bundle.
npm run build
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with .

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Header component location

The original `src/components/Header.tsx` file has been removed. Header-related
components now reside under `src/components/header`. Import from these modules
instead of the old path.

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/44f11ecc-0e77-4a7d-a302-6102d5d50c2b) and click on Share -> Publish.

## Environment Variables

The project reads configuration from Vite environment variables. Copy `.env.sample` to `.env` and fill in your own values before running the app.

Required variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Optional variables:

- `VITE_CLOUD_FUNCTIONS_BASE_URL` &ndash; controls where Firebase Cloud Functions requests are sent.
- `VITE_SMS_LOOKBACK_MONTHS` &ndash; sets the default number of months of SMS history to scan when importing messages (default `6`).

Example Cloud Functions base URLs:

- **Production:** `https://us-central1-xpensia-505ac.cloudfunctions.net`
- **Local emulator:** `http://localhost:5001/xpensia-505ac/us-central1`

Define these variables in your `.env` file when running locally or configure them in your hosting environment.

## Firebase setup

Firebase features such as Cloud Functions and push notifications require a `google-services.json` file in the Android project. If you customise the Android application ID you must also generate a matching `google-services.json`.

1. In the Firebase console create or open your project and add an **Android app**.
2. Use the application ID from `capacitor.config.ts` (default `app.xpensia.com`). If you change this ID update it both in `capacitor.config.ts` and in `android/app/build.gradle`, and rename the Java package folders under `android/app/src/main/java` to match.
3. Download the `google-services.json` generated for that app.
4. Place the file at `android/app/google-services.json`.
5. Rebuild the project so the Google Services Gradle plugin picks up the new configuration.

## Firebase Analytics plugin

The app uses the `@capacitor-firebase/analytics` plugin to send usage events.

1. Install the plugin and sync the native projects:

   ```sh
   npm install @capacitor-firebase/analytics
   npx cap sync
   ```

2. Add the Firebase configuration files:
   - `android/app/google-services.json`
   - `ios/App/App/GoogleService-Info.plist`

3. Rebuild the Android and iOS projects.

4. To verify events while testing, enable DebugView with:

   ```sh
   adb shell setprop debug.firebase.analytics.app <appId>
   ```

   Use the application ID from `capacitor.config.ts` and check the Firebase
   console's **DebugView** tab for incoming events.

## I want to use a custom domain - is that possible?

We don't support custom domains (yet). If you want to deploy your project under your own domain then we recommend using Netlify. Visit our docs for more details: [Custom domains](https://docs.lovable.dev/tips-tricks/custom-domain/)

## Transaction Edit Form Options

The `TransactionEditForm` component supports two optional props for tailoring the form UI:

- `compact`: Displays the form with tighter spacing and smaller inputs.
  Useful on small screens or when space is limited.
- `showNotes`: Controls visibility of the notes field. It is `true` by default.

### Usage examples

Hide the notes field:

```tsx
<TransactionEditForm onSave={handleSave} showNotes={false} />
```

Enable compact mode and hide notes at the same time:

```tsx
<TransactionEditForm onSave={handleSave} compact showNotes={false} />
```


## BackgroundSmsListenerPlugin

`BackgroundSmsListenerPlugin` enables the app to listen for incoming SMS messages while running in the background. The plugin is implemented in the `android` directory and is registered via Capacitor.

Incoming messages received before the plugin initializes are saved to `SharedPreferences`. When the plugin loads, any persisted messages are delivered to JavaScript and then removed from storage.

### Required permissions

The following permissions are required on Android. They are included in `android-manifest-additions.xml`:

```xml
<uses-permission android:name="android.permission.READ_SMS" />
<uses-permission android:name="android.permission.RECEIVE_SMS" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
```

### Enabling the listener

1. Call `checkPermission()` to see if SMS access is granted.
2. If not granted, call `requestPermission()`.
3. After permission is granted, call `startListening()` and register an `smsReceived` listener:

```ts
const perm = await BackgroundSmsListener.checkPermission();
if (!perm.granted) {
  await BackgroundSmsListener.requestPermission();
}
await BackgroundSmsListener.startListening();
BackgroundSmsListener.addListener('smsReceived', ({ sender, body }) => {
  console.log('SMS from', sender, body);
});
```

### Testing delivery after app restart

1. Install the app on a device or emulator.
2. Force stop the app so no processes remain.
3. Send an SMS message to the device while the app is stopped.
4. Launch the app again.
5. Check logcat for tags `STATIC_SMS_RECEIVER`, `PENDING_SMS_DELIVERY`, and `PLUGIN_INIT_LOGS` to confirm:
   - the static receiver stored the SMS,
   - the plugin delivered the pending message on load,
   - and the `smsReceived` listener was triggered.

This ensures SMS messages received while the app was not running are delivered on next startup.

Duplicate SMS events should no longer occur when the listener is active, as the
static receiver now checks whether the plugin is running before persisting or
processing messages.

### Debug logging

Additional log markers are emitted to help verify the SMS workflow:

- `AIS-01` when `SmsReaderService.readSmsMessages` executes.
- `AIS-02` when `SmsImportService.checkForNewMessages` runs.
- `AIS-03` when the app starts the background SMS listener.
- `AIS-04` when the listener is stopped during cleanup.
- `AIS-10`–`AIS-14` from the Android plugin to trace receiver activity.

Use `adb logcat | grep AIS-` while testing to see these markers.

## Exporting Data

On Android and iOS the **Export Data** option saves the CSV to the Documents
directory and then opens the native Share dialog so you can send or store the
file using other apps.

