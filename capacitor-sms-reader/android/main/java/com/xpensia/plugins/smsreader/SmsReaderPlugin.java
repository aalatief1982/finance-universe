package com.xpensia.plugins.smsreader;

import android.Manifest;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;

import androidx.core.app.ActivityCompat;

import com.getcapacitor.*;

import org.json.JSONArray;
import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

@CapacitorPlugin(name = "SmsReaderPlugin")
public class SmsReaderPlugin extends Plugin {

    @PluginMethod
    public void checkPermission(PluginCall call) {
        boolean granted = ActivityCompat.checkSelfPermission(getContext(), Manifest.permission.READ_SMS) == PackageManager.PERMISSION_GRANTED;
        JSObject ret = new JSObject();
        ret.put("granted", granted);
        call.resolve(ret);
    }

    @PluginMethod
    public void requestPermission(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            requestPermissionForAlias("sms", call, "smsPermsCallback");
        } else {
            JSObject ret = new JSObject();
            ret.put("granted", true);
            call.resolve(ret);
        }
    }

    @PermissionCallback
    private void smsPermsCallback(PluginCall call) {
        boolean granted = getPermissionState("sms") == PermissionState.GRANTED;
        JSObject ret = new JSObject();
        ret.put("granted", granted);
        call.resolve(ret);
    }

    @PluginMethod
    public void readSmsMessages(PluginCall call) {
        try {
            JSONArray messages = new JSONArray();
            Uri uri = Uri.parse("content://sms/inbox");
            Cursor cursor = getContext().getContentResolver().query(uri, null, null, null, "date DESC limit 100");

            if (cursor != null) {
                while (cursor.moveToNext()) {
                    JSObject msg = new JSObject();
                    msg.put("sender", cursor.getString(cursor.getColumnIndexOrThrow("address")));
                    msg.put("message", cursor.getString(cursor.getColumnIndexOrThrow("body")));
                    msg.put("date", new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault())
                            .format(new Date(cursor.getLong(cursor.getColumnIndexOrThrow("date")))));
                    messages.put(msg);
                }
                cursor.close();
            }

            JSObject result = new JSObject();
            result.put("messages", messages);
            call.resolve(result);
        } catch (Exception e) {
            call.reject("Failed to read SMS", e);
        }
    }
}
