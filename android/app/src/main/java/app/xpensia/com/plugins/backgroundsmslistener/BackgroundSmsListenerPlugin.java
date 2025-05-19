
package app.xpensia.com.plugins.backgroundsmslistener;

import android.Manifest;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.provider.Telephony;
import android.telephony.SmsMessage;
import android.util.Log;

import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

@CapacitorPlugin(
    name = "BackgroundSmsListener",
    permissions = {
        @Permission(
            alias = "sms",
            strings = {
                Manifest.permission.RECEIVE_SMS,
                Manifest.permission.READ_SMS
            }
        )
    }
)
public class BackgroundSmsListenerPlugin extends Plugin {

    private static final String TAG = "BackgroundSmsListener";
    private static final String SMS_RECEIVED_EVENT = "smsReceived";

    private SmsReceiver smsReceiver;
    private boolean isListening = false;

    @Override
    public void load() {
        Log.d(TAG, "Plugin loading");
        smsReceiver = new SmsReceiver();
    }

    @PluginMethod
    public void checkPermission(PluginCall call) {
        Log.d(TAG, "Checking SMS permissions");
        JSObject result = new JSObject();
        result.put("granted", hasRequiredPermissions());
        call.resolve(result);
    }

    @PluginMethod
    public void startListening(PluginCall call) {
        Log.d(TAG, "startListening called");
        if (isListening) {
            Log.d(TAG, "Already listening for SMS messages");
            call.resolve();
            return;
        }

        // Check if we already have the permission
        if (hasRequiredPermissions()) {
            Log.d(TAG, "We have permissions, registering receiver");
            registerSmsReceiver();
            isListening = true;
            call.resolve();
        } else {
            Log.d(TAG, "Requesting permissions");
            requestPermissionForAlias("sms", call, "permissionCallback");
        }
    }

    @PluginMethod
    public void stopListening(PluginCall call) {
        Log.d(TAG, "stopListening called");
        if (isListening) {
            unregisterSmsReceiver();
            isListening = false;
        }
        call.resolve();
    }

    @PluginMethod
    public void requestPermission(PluginCall call) {
        Log.d(TAG, "requestPermission called");
        if (hasRequiredPermissions()) {
            JSObject result = new JSObject();
            result.put("granted", true);
            call.resolve(result);
            return;
        }
        requestPermissionForAlias("sms", call, "permissionCallback");
    }

    @PermissionCallback
    private void permissionCallback(PluginCall call) {
        JSObject result = new JSObject();
        Log.d(TAG, "Permission callback received");
        
        if (hasRequiredPermissions()) {
            result.put("granted", true);
            
            // If this was called from startListening, register the receiver
            if ("startListening".equals(call.getMethodName())) {
                Log.d(TAG, "Permission granted, registering receiver from callback");
                registerSmsReceiver();
                isListening = true;
            }
            
            call.resolve(result);
        } else {
            result.put("granted", false);
            call.resolve(result);
        }
    }

    @Override
    public boolean hasRequiredPermissions() {
        boolean hasReadSms = getPermissionState(Manifest.permission.READ_SMS).getState().equals("granted");
        boolean hasReceiveSms = getPermissionState(Manifest.permission.RECEIVE_SMS).getState().equals("granted");
        Log.d(TAG, "Read SMS permission: " + hasReadSms + ", Receive SMS permission: " + hasReceiveSms);
        return hasReadSms && hasReceiveSms;
    }

    private void registerSmsReceiver() {
        Log.d(TAG, "Registering SMS receiver");
        try {
            IntentFilter filter = new IntentFilter();
            filter.addAction(Telephony.Sms.Intents.SMS_RECEIVED_ACTION);
            filter.setPriority(IntentFilter.SYSTEM_HIGH_PRIORITY);
            getContext().registerReceiver(smsReceiver, filter);
            Log.d(TAG, "SMS receiver registered successfully");
        } catch (Exception e) {
            Log.e(TAG, "Error registering SMS receiver", e);
        }
    }

    private void unregisterSmsReceiver() {
        Log.d(TAG, "Unregistering SMS receiver");
        try {
            getContext().unregisterReceiver(smsReceiver);
            Log.d(TAG, "SMS receiver unregistered successfully");
        } catch (Exception e) {
            Log.e(TAG, "Error unregistering SMS receiver", e);
        }
    }

    class SmsReceiver extends BroadcastReceiver {
        @Override
        public void onReceive(Context context, Intent intent) {
            if (Telephony.Sms.Intents.SMS_RECEIVED_ACTION.equals(intent.getAction())) {
                Log.d(TAG, "SMS received in broadcast receiver");
                
                Bundle bundle = intent.getExtras();
                if (bundle != null) {
                    Object[] pdus = (Object[]) bundle.get("pdus");
                    if (pdus != null) {
                        String format = bundle.getString("format");
                        StringBuilder fullMessage = new StringBuilder();
                        String sender = "";
                        
                        for (Object pdu : pdus) {
                            SmsMessage message;
                            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
                                message = SmsMessage.createFromPdu((byte[]) pdu, format);
                            } else {
                                message = SmsMessage.createFromPdu((byte[]) pdu);
                            }
                            
                            sender = message.getOriginatingAddress();
                            fullMessage.append(message.getMessageBody());
                        }
                        
                        Log.d(TAG, "SMS from " + sender + ": " + fullMessage.toString());
                        notifySmsReceived(sender, fullMessage.toString());
                    }
                }
            }
        }
    }

    private void notifySmsReceived(String sender, String message) {
        Log.d(TAG, "Notifying SMS received: " + sender + " - " + message);
        JSObject data = new JSObject();
        data.put("sender", sender);
        data.put("body", message);
        notifyListeners(SMS_RECEIVED_EVENT, data);
    }
    
    @Override
    protected void handleOnDestroy() {
        if (isListening) {
            unregisterSmsReceiver();
            isListening = false;
        }
        super.handleOnDestroy();
    }
}
