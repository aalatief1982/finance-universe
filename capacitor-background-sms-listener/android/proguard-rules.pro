# Keep plugin classes and their methods
-keep class app.xpensia.com.plugins.backgroundsmslistener.** { *; }

# Keep any annotations that the plugin might use
-keep @interface com.getcapacitor.annotation.*
-keepattributes *Annotation*

# Keep JavaScript interfaces
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Rules for Capacitor
-keep class com.getcapacitor.** { *; }
-dontwarn com.getcapacitor.**
