

## Root Cause: Plugin Registration Order in MainActivity

The error `"ShareTarget" plugin is not implemented on android` occurs because **`registerPlugin()` calls happen AFTER `super.onCreate()`** in `MainActivity.java`.

In Capacitor 6, `registerPlugin()` must be called **before** `super.onCreate()`. The bridge boots during `super.onCreate()`, and any plugins registered after that point are not available to the JS layer. That's why `consumePendingSharedText()` throws "not implemented".

BackgroundSmsListener works because it's a separate Gradle module listed in `capacitor.settings.gradle`, so Capacitor auto-discovers it. ShareTargetPlugin and AndroidSettingsPlugin are local app plugins that rely on manual `registerPlugin()` -- which currently runs too late.

### Additional Issue: ProGuard (Release Builds)

The ProGuard rules in `android/app/proguard-rules.pro` keep `com.xpensia.**` but the actual plugin package is `app.xpensia.com.**`. This means release builds will strip the plugin classes. Need to add `app.xpensia.**` to the keep rules.

### Changes

**1. `android/app/src/main/java/app/xpensia/com/MainActivity.java`**

Move all four `registerPlugin()` calls to **before** `super.onCreate(savedInstanceState)`:

```java
@Override
public void onCreate(Bundle savedInstanceState) {
    // Register plugins BEFORE super.onCreate() so the bridge knows about them
    registerPlugin(SmsReaderPlugin.class);
    registerPlugin(BackgroundSmsListenerPlugin.class);
    registerPlugin(AndroidSettingsPlugin.class);
    registerPlugin(ShareTargetPlugin.class);

    handleRouteIntent(getIntent());
    handleShareIntent(getIntent());

    super.onCreate(savedInstanceState);
}
```

**2. `android/app/proguard-rules.pro`**

Add keep rule for the correct package prefix:

```
-keep class app.xpensia.** { *; }
-dontwarn app.xpensia.**
```

After these changes, you need to rebuild the Android app (`npx cap sync && npx cap run android`).

