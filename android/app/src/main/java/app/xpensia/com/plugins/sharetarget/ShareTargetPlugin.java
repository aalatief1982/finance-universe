package app.xpensia.com.plugins.sharetarget;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.ArrayList;

@CapacitorPlugin(name = "ShareTarget")
public class ShareTargetPlugin extends Plugin {
    private static final String TAG = "ShareTargetPlugin";
    private static final String PREFS_NAME = "ShareTargetPrefs";
    private static final String PREF_PENDING_TEXT = "pendingSharedText";
    private static final String PREF_PENDING_SOURCE = "pendingSharedTextSource";
    private static final String PREF_PENDING_RECEIVED_AT = "pendingSharedTextReceivedAt";

    private static final Object PREF_LOCK = new Object();
    private static final ArrayList<JSObject> pendingEvents = new ArrayList<>();
    private static ShareTargetPlugin instance;

    @Override
    public void load() {
        super.load();
        instance = this;

        synchronized (pendingEvents) {
            if (!pendingEvents.isEmpty()) {
                for (JSObject event : pendingEvents) {
                    notifyListeners("sharedTextReceived", event);
                }
                pendingEvents.clear();
            }
        }
    }

    public static void setPendingSharedText(Context context, String text, String source) {
        if (context == null || text == null) {
            return;
        }

        String normalizedText = text.trim();
        if (normalizedText.isEmpty()) {
            return;
        }

        long receivedAt = System.currentTimeMillis();

        synchronized (PREF_LOCK) {
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            prefs.edit()
                .putString(PREF_PENDING_TEXT, normalizedText)
                .putString(PREF_PENDING_SOURCE, source)
                .putLong(PREF_PENDING_RECEIVED_AT, receivedAt)
                .apply();
        }

        JSObject payload = new JSObject();
        payload.put("text", normalizedText);
        payload.put("source", source);
        payload.put("receivedAt", receivedAt);

        if (instance != null) {
            instance.notifyListeners("sharedTextReceived", payload);
        } else {
            synchronized (pendingEvents) {
                pendingEvents.add(payload);
            }
        }

        Log.d(TAG, "Stored pending shared text. length=" + normalizedText.length());
    }

    @PluginMethod
    public void consumePendingSharedText(PluginCall call) {
        JSObject ret = new JSObject();

        synchronized (PREF_LOCK) {
            SharedPreferences prefs = getContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            String text = prefs.getString(PREF_PENDING_TEXT, null);
            String source = prefs.getString(PREF_PENDING_SOURCE, null);
            long receivedAt = prefs.getLong(PREF_PENDING_RECEIVED_AT, 0L);

            prefs.edit()
                .remove(PREF_PENDING_TEXT)
                .remove(PREF_PENDING_SOURCE)
                .remove(PREF_PENDING_RECEIVED_AT)
                .apply();

            if (text != null) {
                ret.put("text", text);
            }
            if (source != null) {
                ret.put("source", source);
            }
            if (receivedAt > 0L) {
                ret.put("receivedAt", receivedAt);
            }
        }

        call.resolve(ret);
    }
}
