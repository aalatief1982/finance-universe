
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
import com.getcapacitor.PermissionState;
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
        smsReceiver = new SmsReceiver();
    }

    @PluginMethod
    public void startListening(PluginCall call) {
        if (isListening) {
            call.resolve();
            return;
        }

        // Check if we already have the permission
        if (hasRequiredPermissions()) {
            registerSmsReceiver();
            isListening = true;
            call.resolve();
        } else {
            requestPermissionForAlias("sms", call, "permissionCallback");
        }
    }

    @PluginMethod
    public void stopListening(PluginCall call) {
        if (isListening) {
            unregisterSmsReceiver();
            isListening = false;
        }
        call.resolve();
    }

    @PluginMethod
    public void checkPermission(PluginCall call) {
        JSObject result = new JSObject();
        result.put("granted", hasRequiredPermissions());
        call.resolve(result);
    }

    @PluginMethod
    public void requestPermission(PluginCall call) {
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
        
        if (hasRequiredPermissions()) {
            result.put("granted", true);
            
            // If this was called from startListening, register the receiver
            if (call.getMethodName().equals("startListening")) {
                registerSmsReceiver();
                isListening = true;
            }
            
            call.resolve(result);
        } else {
            result.put("granted", false);
            call.resolve(result);
        }
    }

    private boolean hasRequiredPermissions() {
        return getPermissionState("sms") == PermissionState.GRANTED;
    }

    private void registerSmsReceiver() {
        Log.d(TAG, "Registering SMS receiver");
        IntentFilter filter = new IntentFilter();
        filter.addAction(Telephony.Sms.Intents.SMS_RECEIVED_ACTION);
        getActivity().registerReceiver(smsReceiver, filter);
    }

    private void unregisterSmsReceiver() {
        Log.d(TAG, "Unregistering SMS receiver");
        try {
            getActivity().unregisterReceiver(smsReceiver);
        } catch (Exception e) {
            Log.e(TAG, "Error unregistering SMS receiver", e);
        }
    }

    class SmsReceiver extends BroadcastReceiver {
        @Override
        public void onReceive(Context context, Intent intent) {
            if (Telephony.Sms.Intents.SMS_RECEIVED_ACTION.equals(intent.getAction())) {
                Log.d(TAG, "SMS received");
                
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
