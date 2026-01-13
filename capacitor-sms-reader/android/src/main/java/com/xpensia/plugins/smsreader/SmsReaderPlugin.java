
package com.xpensia.plugins.smsreader;

import android.Manifest;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.net.Uri;
import android.provider.Telephony;
import android.os.Build;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import com.getcapacitor.PermissionState;

import org.json.JSONException;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

@CapacitorPlugin(
    name = "SmsReaderPlugin",
    permissions = {
        @Permission(
            strings = { Manifest.permission.READ_SMS },
            alias = "read_sms"
        )
    }
)
public class SmsReaderPlugin extends Plugin {

    @PluginMethod
    public void checkPermission(PluginCall call) {
        boolean hasPermission = hasRequiredPermissions();
        JSObject ret = new JSObject();
        ret.put("granted", hasPermission);
        call.resolve(ret);
    }

    @PluginMethod
    public void checkPermissionWithRationale(PluginCall call) {
        boolean hasPermission = hasRequiredPermissions();
        boolean shouldShowRationale = false;
        if (!hasPermission && Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && getActivity() != null) {
            shouldShowRationale = getActivity()
                    .shouldShowRequestPermissionRationale(Manifest.permission.READ_SMS);
        }
        JSObject ret = new JSObject();
        ret.put("granted", hasPermission);
        ret.put("shouldShowRationale", shouldShowRationale);
        call.resolve(ret);
    }

    @PluginMethod
    public void requestPermission(PluginCall call) {
        if (hasRequiredPermissions()) {
            JSObject ret = new JSObject();
            ret.put("granted", true);
            call.resolve(ret);
            return;
        }

        requestPermissionForAlias("read_sms", call, "permissionCallback");
    }

    @PluginMethod
    public void readSmsMessages(PluginCall call) {
        if (!hasRequiredPermissions()) {
            call.reject("Permission not granted to read SMS");
            return;
        }

        String startDate = call.getString("startDate");
        String endDate = call.getString("endDate");
        Integer limit = call.getInt("limit", 100);
        JSArray senders = call.getArray("senders");

        JSObject ret = new JSObject();
        JSArray messages = new JSArray();
        
        try {
            // Define the columns we want to retrieve
            String[] projection = new String[]{
                    Telephony.Sms.ADDRESS,
                    Telephony.Sms.BODY,
                    Telephony.Sms.DATE
            };

            // Create selection criteria if startDate/endDate is provided
            String selection = "";
            String[] selectionArgs = null;

            if (startDate != null && endDate != null) {
                selection = Telephony.Sms.DATE + " BETWEEN ? AND ?";
                selectionArgs = new String[]{startDate, endDate};
            }

            // Query the SMS content provider
            Cursor cursor = getContext().getContentResolver().query(
                    Telephony.Sms.Inbox.CONTENT_URI,
                    projection,
                    selection,
                    selectionArgs,
                    Telephony.Sms.DATE + " DESC LIMIT " + limit
            );

            if (cursor != null && cursor.moveToFirst()) {
                SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US);
                
                do {
                    String sender = cursor.getString(cursor.getColumnIndexOrThrow(Telephony.Sms.ADDRESS));
                    String message = cursor.getString(cursor.getColumnIndexOrThrow(Telephony.Sms.BODY));
                    long timestamp = cursor.getLong(cursor.getColumnIndexOrThrow(Telephony.Sms.DATE));
                    
                    // Skip if we have a senders filter and this sender is not in the list
                    if (senders != null && senders.length() > 0) {
                        boolean senderMatch = false;
                        for (int i = 0; i < senders.length(); i++) {
                            try {
                                String targetSender = senders.getString(i);
                                if (sender.contains(targetSender)) {
                                    senderMatch = true;
                                    break;
                                }
                            } catch (JSONException e) {
                                // Ignore errors in sender matching
                            }
                        }
                        if (!senderMatch) continue;
                    }
                    
                    // Create a JSON object for this message
                    JSObject msg = new JSObject();
                    msg.put("sender", sender);
                    msg.put("message", message);
                    msg.put("date", dateFormat.format(new Date(timestamp)));
                    messages.put(msg);
                } while (cursor.moveToNext());

                cursor.close();
            }
            
            ret.put("messages", messages);
            call.resolve(ret);
            
        } catch (Exception e) {
            call.reject("Failed to read SMS messages: " + e.getMessage(), e);
        }
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

    @PermissionCallback
    private void permissionCallback(PluginCall call) {
        PermissionState state = getPermissionState("read_sms");
        JSObject ret = new JSObject();
        ret.put("granted", state == PermissionState.GRANTED);
        call.resolve(ret);
    }
}
