
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

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;

@CapacitorPlugin(
    name = "BackgroundSmsListener",
    permissions = {
        @Permission(
            strings = { Manifest.permission.RECEIVE_SMS },
            alias = "receive_sms"
        )
    }
)
public class BackgroundSmsListenerPlugin extends Plugin {
    private static final String TAG = "BackgroundSmsListener";
    private BroadcastReceiver smsReceiver = null;
    private boolean isListening = false;

    @PluginMethod
    public void checkPermission(PluginCall call) {
        Log.d(TAG, "Checking SMS receive permission");
        boolean hasPermission = hasRequiredPermissions();
        JSObject ret = new JSObject();
        ret.put("granted", hasPermission);
        call.resolve(ret);
    }

    @PluginMethod
    public void requestPermission(PluginCall call) {
        Log.d(TAG, "Requesting SMS receive permission");
        if (hasRequiredPermissions()) {
            JSObject ret = new JSObject();
            ret.put("granted", true);
            call.resolve(ret);
            return;
        }

        requestPermissionForAlias("receive_sms", call, "permissionCallback");
    }

    @PluginMethod
    public void startListening(PluginCall call) {
        Log.d(TAG, "Start listening to SMS");
        if (!hasRequiredPermissions()) {
            call.reject("Permission not granted to receive SMS");
            return;
        }

        if (isListening) {
            Log.d(TAG, "Already listening to SMS");
            call.resolve();
            return;
        }

        registerSmsReceiver();
        isListening = true;
        call.resolve();
    }

    @PluginMethod
    public void stopListening(PluginCall call) {
        Log.d(TAG, "Stop listening to SMS");
        if (smsReceiver != null) {
            Log.d(TAG, "Unregistering SMS receiver");
            try {
                getContext().unregisterReceiver(smsReceiver);
                smsReceiver = null;
                isListening = false;
            } catch (Exception e) {
                Log.e(TAG, "Error unregistering SMS receiver", e);
            }
        }
        call.resolve();
    }

    private void registerSmsReceiver() {
        Log.d(TAG, "Registering SMS receiver");
        if (smsReceiver != null) {
            try {
                getContext().unregisterReceiver(smsReceiver);
            } catch (Exception e) {
                Log.e(TAG, "Error unregistering existing SMS receiver", e);
            }
        }

        smsReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                Log.d(TAG, "SMS received");
                if (Telephony.Sms.Intents.SMS_RECEIVED_ACTION.equals(intent.getAction())) {
                    Bundle bundle = intent.getExtras();
                    if (bundle != null) {
                        Object[] pdus = (Object[]) bundle.get("pdus");
                        if (pdus != null) {
                            for (Object pdu : pdus) {
                                SmsMessage smsMessage = SmsMessage.createFromPdu((byte[]) pdu);
                                String sender = smsMessage.getDisplayOriginatingAddress();
                                String body = smsMessage.getMessageBody();
                                
                                Log.d(TAG, "SMS from: " + sender);
                                Log.d(TAG, "Message: " + body);
                                
                                JSObject data = new JSObject();
                                data.put("sender", sender);
                                data.put("body", body);
                                notifyListeners("smsReceived", data);
                            }
                        }
                    }
                }
            }
        };

        IntentFilter filter = new IntentFilter(Telephony.Sms.Intents.SMS_RECEIVED_ACTION);
        getContext().registerReceiver(smsReceiver, filter, Context.RECEIVER_EXPORTED);
    }

    @Override
    protected void handleRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.handleRequestPermissionsResult(requestCode, permissions, grantResults);
        
        PluginCall savedCall = getSavedCall();
        if (savedCall == null) {
            return;
        }

        for (int result : grantResults) {
            if (result != PackageManager.PERMISSION_GRANTED) {
                JSObject ret = new JSObject();
                ret.put("granted", false);
                savedCall.resolve(ret);
                return;
            }
        }
        
        JSObject ret = new JSObject();
        ret.put("granted", true);
        savedCall.resolve(ret);
    }

    @Override
    protected void handleOnDestroy() {
        if (smsReceiver != null) {
            try {
                getContext().unregisterReceiver(smsReceiver);
                smsReceiver = null;
                isListening = false;
            } catch (Exception e) {
                Log.e(TAG, "Error unregistering SMS receiver during destroy", e);
            }
        }
        super.handleOnDestroy();
    }
}
