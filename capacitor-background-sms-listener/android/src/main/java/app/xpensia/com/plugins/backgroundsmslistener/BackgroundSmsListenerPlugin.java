
package app.xpensia.com.plugins.backgroundsmslistener;

import android.Manifest;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.os.Build;
import android.provider.Telephony;
import android.telephony.SmsMessage;
import android.util.Log;
import android.content.ComponentName;

import androidx.core.content.ContextCompat;


import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import java.util.ArrayList;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

@CapacitorPlugin(
    name = "BackgroundSmsListener",
    permissions = {
        @Permission(strings = { Manifest.permission.RECEIVE_SMS }, alias = "receive_sms")
    }
)
public class BackgroundSmsListenerPlugin extends Plugin {
    private static final String TAG = "BackgroundSmsListener";
    private static final String STATIC_TAG = "STATIC_SMS_RECEIVER";
    private static final String PENDING_TAG = "PENDING_SMS_DELIVERY";
    private static final String INIT_TAG = "PLUGIN_INIT_LOGS";
    private static final String PREFS_NAME = "BackgroundSmsPrefs";
    private static final String PREF_KEY = "newIncomingBuffer";
    private static final String PREF_PENDING_ROUTE = "pendingOpenRoute";
    private static final String PREF_PENDING_SOURCE = "pendingOpenSource";
    private static final Object PREF_LOCK = new Object();
    private static final int MAX_INBOX_ITEMS = 200;
    private static final long DEDUP_WINDOW_MS = 10 * 60 * 1000;

    private static BackgroundSmsListenerPlugin instance;
    private static final ArrayList<JSObject> pendingMessages = new ArrayList<>();
    private boolean isListening = false;
    private BroadcastReceiver smsReceiver;

    /**
     * Returns true if the plugin instance exists and is actively listening for
     * SMS messages.
     */
    public static boolean isPluginActive() {
        return instance != null && instance.isListening;
    }

    @Override
    public void load() {
        Log.d(INIT_TAG, "Plugin load() called");
        super.load();
        instance = this;
        checkStaticReceiver();
        synchronized (pendingMessages) {
            if (!pendingMessages.isEmpty()) {
                Log.d(PENDING_TAG, "Delivering " + pendingMessages.size() + " queued SMS messages");
                for (JSObject msg : pendingMessages) {
                    notifyListeners("smsReceived", msg);
                }
                pendingMessages.clear();
            }
        }
    }

    public static void notifySmsReceived(Context context, String sender, String body) {
        JSObject data = new JSObject();
        data.put("sender", sender);
        data.put("body", body);

        if (instance != null) {
            instance.notifyListeners("smsReceived", data);
        } else {
            Log.d(PENDING_TAG, "Instance null, queuing SMS message");
            synchronized (pendingMessages) {
                pendingMessages.add(data);
            }
        }
    }

    static void handleIncomingSms(Context context, String sender, String body, String source, boolean emitToJs) {
        if (!FinancialSmsClassifier.isFinancialTransactionMessage(body)) {
            Log.d(TAG, "Skipping non-financial SMS from " + sender);
            return;
        }

        long receivedAt = System.currentTimeMillis();
        String hash = buildHash(sender, body);
        int queueSize = persistMessage(
                context,
                sender != null ? sender : "",
                body,
                receivedAt,
                source,
                hash
        );

        Log.d(PENDING_TAG, "Persisted qualifying SMS hash=" + hash + " queueSize=" + queueSize + " source=" + source);

        if (emitToJs) {
            notifySmsReceived(context, sender != null ? sender : "", body);
        }

        SmsBroadcastReceiver.postOrUpdateSummaryNotification(context, queueSize);
    }

    static String buildHash(String sender, String body) {
        String normalizedSender = sender == null ? "" : sender.trim().replaceAll("\\s+", "").toLowerCase();
        String normalizedBody = body == null ? "" : body.trim().replaceAll("\\s+", " ").toLowerCase();
        String base = normalizedSender + "|" + normalizedBody + "|" + normalizedBody.length();
        return Integer.toHexString(base.hashCode());
    }

    private void checkStaticReceiver() {
        ComponentName cn = new ComponentName(getContext(), SmsBroadcastReceiver.class);
        try {
            getContext().getPackageManager().getReceiverInfo(cn, PackageManager.ComponentInfoFlags.of(0));
            Log.d(STATIC_TAG, "Static SMS receiver registered");
        } catch (PackageManager.NameNotFoundException e) {
            Log.w(STATIC_TAG, "SmsBroadcastReceiver not found in manifest");
        }
    }

    private void deliverPersistedMessages() {
        Log.d(PENDING_TAG, "Checking for persisted messages");
        synchronized (PREF_LOCK) {
            SharedPreferences prefs = getContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            String stored = prefs.getString(PREF_KEY, null);
            if (stored != null && !stored.isEmpty()) {
                try {
                    JSONArray arr = new JSONArray(stored);
                    Log.d(PENDING_TAG, "Delivering " + arr.length() + " persisted SMS messages");
                    for (int i = 0; i < arr.length(); i++) {
                        JSONObject obj = arr.getJSONObject(i);
                        JSObject data = new JSObject();
                        data.put("sender", obj.optString("sender"));
                        data.put("body", obj.optString("body"));
                        notifyListeners("smsReceived", data);
                    }
                } catch (JSONException e) {
                    Log.e(TAG, "Failed to parse persisted SMS messages", e);
                }
                prefs.edit().remove(PREF_KEY).apply();
            } else {
                Log.d(PENDING_TAG, "No persisted SMS messages found");
            }
        }
    }

    static int persistMessage(Context context, String sender, String body, long receivedAt, String source, String hash) {
        synchronized (PREF_LOCK) {
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            String stored = prefs.getString(PREF_KEY, "[]");
            JSONArray arr;
            try {
                arr = new JSONArray(stored);
            } catch (JSONException e) {
                arr = new JSONArray();
            }

            JSONArray nextArr = new JSONArray();
            for (int i = 0; i < arr.length(); i++) {
                JSONObject existing = arr.optJSONObject(i);
                if (existing == null) {
                    continue;
                }
                long existingAt = existing.optLong("receivedAt", 0L);
                String existingHash = existing.optString("hash", "");
                if (!existingHash.isEmpty() && existingHash.equals(hash) && Math.abs(receivedAt - existingAt) <= DEDUP_WINDOW_MS) {
                    Log.d(PENDING_TAG, "Skipping native duplicate SMS hash=" + hash);
                    return arr.length();
                }
                nextArr.put(existing);
            }

            JSONObject obj = new JSONObject();
            try {
                obj.put("sender", sender);
                obj.put("body", body);
                obj.put("receivedAt", receivedAt);
                obj.put("source", source);
                obj.put("hash", hash);
            } catch (JSONException e) {
                Log.e(TAG, "Failed to encode SMS message", e);
            }

            nextArr.put(obj);
            if (nextArr.length() > MAX_INBOX_ITEMS) {
                JSONArray trimmed = new JSONArray();
                int start = nextArr.length() - MAX_INBOX_ITEMS;
                for (int i = start; i < nextArr.length(); i++) {
                    trimmed.put(nextArr.opt(i));
                }
                nextArr = trimmed;
            }

            prefs.edit().putString(PREF_KEY, nextArr.toString()).apply();
            Log.d(PENDING_TAG, "Persisted SMS from " + sender + " queueSize=" + nextArr.length());
            return nextArr.length();
        }
    }

    @PluginMethod
    public void drainPersistedMessages(PluginCall call) {
        JSObject ret = new JSObject();
        JSONArray messages = new JSONArray();
        synchronized (PREF_LOCK) {
            SharedPreferences prefs = getContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            String stored = prefs.getString(PREF_KEY, "[]");
            try {
                JSONArray arr = new JSONArray(stored);
                for (int i = 0; i < arr.length(); i++) {
                    JSONObject obj = arr.optJSONObject(i);
                    if (obj != null) {
                        messages.put(obj);
                    }
                }
            } catch (JSONException e) {
                Log.e(TAG, "Failed to parse persisted SMS queue", e);
            }
            prefs.edit().remove(PREF_KEY).apply();
        }
        ret.put("messages", messages);
        call.resolve(ret);
    }

    public static void setPendingOpenRoute(Context context, String route, String source) {
        synchronized (PREF_LOCK) {
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            prefs.edit().putString(PREF_PENDING_ROUTE, route).putString(PREF_PENDING_SOURCE, source).apply();
        }
    }

    @PluginMethod
    public void consumePendingOpenRoute(PluginCall call) {
        JSObject ret = new JSObject();
        synchronized (PREF_LOCK) {
            SharedPreferences prefs = getContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            String route = prefs.getString(PREF_PENDING_ROUTE, null);
            String source = prefs.getString(PREF_PENDING_SOURCE, null);
            prefs.edit().remove(PREF_PENDING_ROUTE).remove(PREF_PENDING_SOURCE).apply();
            if (route != null) {
                ret.put("route", route);
            }
            if (source != null) {
                ret.put("source", source);
            }
        }
        call.resolve(ret);
    }

    /**
     * Check if the SMS permission is granted
     */
    @PluginMethod
    public void checkPermission(PluginCall call) {
        Log.d(TAG, "checkPermission called");
        try {
            boolean hasPermission = hasRequiredPermissions();
            JSObject ret = new JSObject();
            ret.put("granted", hasPermission);
            call.resolve(ret);
            Log.d(TAG, "checkPermission result: " + hasPermission);
        } catch (Exception e) {
            Log.e(TAG, "Error in checkPermission", e);
            call.reject("Error checking permission: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void checkPermissionWithRationale(PluginCall call) {
        Log.d(TAG, "checkPermissionWithRationale called");
        try {
            boolean hasPermission = hasRequiredPermissions();
            boolean shouldShowRationale = false;
            if (!hasPermission && Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && getActivity() != null) {
                shouldShowRationale = getActivity()
                        .shouldShowRequestPermissionRationale(Manifest.permission.RECEIVE_SMS);
            }
            JSObject ret = new JSObject();
            ret.put("granted", hasPermission);
            ret.put("shouldShowRationale", shouldShowRationale);
            call.resolve(ret);
            Log.d(TAG, "checkPermissionWithRationale result: " + hasPermission + ", rationale: " + shouldShowRationale);
        } catch (Exception e) {
            Log.e(TAG, "Error in checkPermissionWithRationale", e);
            call.reject("Error checking permission rationale: " + e.getMessage(), e);
        }
    }

    /**
     * Request SMS permission
     */
    @PluginMethod
    public void requestPermission(PluginCall call) {
        Log.d(TAG, "requestPermission called");
        try {
            if (hasRequiredPermissions()) {
                JSObject ret = new JSObject();
                ret.put("granted", true);
                call.resolve(ret);
                Log.d(TAG, "Permission already granted");
                return;
            }

            saveCall(call);
            pluginRequestPermissions(new String[] { Manifest.permission.RECEIVE_SMS }, 1);
            Log.d(TAG, "Requested RECEIVE_SMS permission");
        } catch (Exception e) {
            Log.e(TAG, "Error in requestPermission", e);
            call.reject("Error requesting permission: " + e.getMessage(), e);
        }
    }

    /**
     * Start listening for SMS messages
     */
    @PluginMethod
    public void startListening(PluginCall call) {
        Log.d(TAG, "startListening called");
        try {
            if (!hasRequiredPermissions()) {
                call.reject("SMS permission not granted");
                Log.d(TAG, "Cannot start listening, permission not granted");
                return;
            }

            if (isListening) {
                call.resolve();
                Log.d(TAG, "Already listening for SMS");
                return;
            }

            registerSmsReceiver();

            call.resolve();
            Log.d(TAG, "Now listening for SMS messages");
        } catch (Exception e) {
            Log.e(TAG, "Error in startListening", e);
            call.reject("Error starting SMS listener: " + e.getMessage(), e);
        }
    }

    /**
     * Stop listening for SMS messages
     */
    @PluginMethod
    public void stopListening(PluginCall call) {
        Log.d(TAG, "stopListening called");
        try {
            if (!isListening) {
                call.resolve();
                Log.d(TAG, "Not currently listening, nothing to do");
                return;
            }

            unregisterSmsReceiver();

            Context context = getContext();
            call.resolve();
            Log.d(TAG, "Stopped listening for SMS messages");
        } catch (Exception e) {
            Log.e(TAG, "Error in stopListening", e);
            call.reject("Error stopping SMS listener: " + e.getMessage(), e);
        }
    }

    /**
     * Register the SMS receiver to listen for incoming SMS messages
     */
    private void registerSmsReceiver() {
        Log.d(TAG, "Registering SMS receiver");
        if (smsReceiver != null) {
            unregisterSmsReceiver();
        }

        smsReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                Log.d(TAG, "SMS received in broadcast receiver");
                if (Telephony.Sms.Intents.SMS_RECEIVED_ACTION.equals(intent.getAction())) {
                    SmsMessage[] messages = null;
                    
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
                        messages = Telephony.Sms.Intents.getMessagesFromIntent(intent);
                    } else {
                        // For older Android versions (unlikely in modern apps)
                        Object[] pdus = (Object[]) intent.getExtras().get("pdus");
                        if (pdus != null) {
                            messages = new SmsMessage[pdus.length];
                            for (int i = 0; i < pdus.length; i++) {
                                messages[i] = SmsMessage.createFromPdu((byte[]) pdus[i]);
                            }
                        }
                    }
                    
                    if (messages != null && messages.length > 0) {
                        StringBuilder bodyBuilder = new StringBuilder();
                        String sender = messages[0].getOriginatingAddress();
                        
                        // Concatenate multi-part messages
                        for (SmsMessage message : messages) {
                            bodyBuilder.append(message.getMessageBody());
                        }
                        String body = bodyBuilder.toString();
                        
                        Log.d(TAG, "SMS received from " + sender + ": " + body);

                        handleIncomingSms(context, sender, body, "listener", true);
                    }
                }
            }
        };

        IntentFilter filter = new IntentFilter(Telephony.Sms.Intents.SMS_RECEIVED_ACTION);
        filter.setPriority(999); // High priority to receive SMS before other apps
        getContext().registerReceiver(smsReceiver, filter);
        isListening = true;
        Log.d(TAG, "SMS receiver registered successfully");
    }

    /**
     * Unregister the SMS receiver
     */
    private void unregisterSmsReceiver() {
        Log.d(TAG, "Unregistering SMS receiver");
        if (smsReceiver != null) {
            try {
                getContext().unregisterReceiver(smsReceiver);
                Log.d(TAG, "SMS receiver unregistered");
            } catch (Exception e) {
                Log.e(TAG, "Error unregistering receiver", e);
            }
            smsReceiver = null;
        }
        isListening = false;
    }

    @Override
    protected void handleRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        Log.d(TAG, "handleRequestPermissionsResult: " + requestCode);
        super.handleRequestPermissionsResult(requestCode, permissions, grantResults);

        PluginCall savedCall = getSavedCall();
        if (savedCall == null) {
            Log.d(TAG, "No saved call for permissions request");
            return;
        }

        for (int result : grantResults) {
            if (result != PackageManager.PERMISSION_GRANTED) {
                Log.d(TAG, "Permission not granted");
                JSObject ret = new JSObject();
                ret.put("granted", false);
                savedCall.resolve(ret);
                return;
            }
        }

        Log.d(TAG, "All permissions granted");
        JSObject ret = new JSObject();
        ret.put("granted", true);
        savedCall.resolve(ret);
    }

    @Override
    protected void handleOnDestroy() {
        Log.d(TAG, "Plugin is being destroyed, cleaning up");
        unregisterSmsReceiver();
        instance = null;
        super.handleOnDestroy();
    }
}
